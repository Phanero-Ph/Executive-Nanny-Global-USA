import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { adminAccess, adminAccessLock, reviewEvents, users } from "../src/db/schema";
import { queueAdminInvitation } from "../src/lib/admin-management";

const productionOrigin = "https://executiveglobalnannyusa.com";

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Set NODE_ENV=production before using the production admin bootstrap.");
  }
  if (process.env.APP_URL !== productionOrigin) {
    throw new Error(`Set APP_URL to ${productionOrigin} before using the production admin bootstrap.`);
  }
  if (process.env.ADMIN_BOOTSTRAP_CONFIRM !== "CREATE_FIRST_PRODUCTION_SUPER_ADMIN") {
    throw new Error("Set ADMIN_BOOTSTRAP_CONFIRM=CREATE_FIRST_PRODUCTION_SUPER_ADMIN for this one-time operation.");
  }

  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!name || name.length > 255 || !email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Set ADMIN_NAME and a valid ADMIN_EMAIL for the first production administrator.");
  }

  await db.transaction(async (tx) => {
    await tx.insert(adminAccessLock).values({ id: 1 }).onDuplicateKeyUpdate({ set: { id: 1 } });
    await tx.select().from(adminAccessLock).where(eq(adminAccessLock.id, 1)).for("update");

    const [existingAdmin] = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
    if (existingAdmin) throw new Error("A production administrator already exists; bootstrap refused.");

    const [existingAccount] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingAccount) throw new Error("An account already uses this email; bootstrap refused.");

    const id = randomUUID();
    await tx.insert(users).values({
      id,
      name,
      email,
      role: "admin",
      passwordHash: `invited:${randomBytes(32).toString("hex")}`,
    });
    await tx.insert(adminAccess).values({
      userId: id,
      superAdmin: 1,
      status: "invited",
      roleLabel: "Super Admin",
      permissions: "[]",
    });
    await queueAdminInvitation(tx, { id, name, email }, id);
    await tx.insert(reviewEvents).values({
      reviewerId: id,
      fromStatus: "admin_bootstrap",
      toStatus: "invited",
      note: "First production Super Admin invitation created through the one-time bootstrap command.",
    });
  });

  console.log("First production Super Admin invitation queued. Run the mail delivery job to send the invitation email.");
}

bootstrap()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Production admin bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
