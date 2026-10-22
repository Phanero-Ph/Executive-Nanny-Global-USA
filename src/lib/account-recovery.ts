import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountTokens, recoveryLimits, users } from "@/db/schema";
import { appUrl, queueEmail } from "@/lib/mail";
export async function recoveryAllowed(email: string) {
 const window = Math.floor(Date.now() / 900000);
 for (const [scope,limit] of [["global",100],[email,3]] as const) {
  const key = createHash("sha256").update(`recovery:${scope}:${window}`).digest("hex");
  await db.insert(recoveryLimits).values({ key }).onDuplicateKeyUpdate({ set: { count:sql`${recoveryLimits.count} + 1` } });
  const [row] = await db.select().from(recoveryLimits).where(eq(recoveryLimits.key,key));
  if (row.count > limit) return false;
 }
 return true;
}
export async function issueAccountToken(userId: string, purpose: "reset" | "verify") {
 const [user] = await db.select().from(users).where(eq(users.id,userId)).limit(1);
 if (!user || (purpose === "verify" && user.emailVerifiedAt)) return;
 const recent = await db.select({ id:accountTokens.id }).from(accountTokens).where(and(eq(accountTokens.userId,userId),eq(accountTokens.purpose,purpose),gte(accountTokens.createdAt,new Date(Date.now()-60000)))).orderBy(desc(accountTokens.createdAt)).limit(1);
 if (recent.length) return;
 const token = randomBytes(32).toString("hex");
 await db.insert(accountTokens).values({ userId, purpose, tokenHash:createHash("sha256").update(token).digest("hex"), expiresAt:new Date(Date.now()+(purpose === "reset" ? 1800000 : 86400000)) });
 const link = appUrl(`/${purpose === "reset" ? "reset-password" : "verify-email"}?token=${token}`);
 await queueEmail(userId,user.email,purpose === "reset" ? "Reset your password" : "Verify your email address",`${purpose === "reset" ? "Use the link below to set a new password. It expires in 30 minutes." : "Verify your email using the link below. It expires in 24 hours."}\n\n${link}\n\nIf you did not request this, you can ignore this email.\n\nExecutive Global Nanny`);
}
export async function notifyVerification(userId: string) {
 try { await issueAccountToken(userId,"verify"); } catch { console.error("Verification email could not be queued."); }
}
