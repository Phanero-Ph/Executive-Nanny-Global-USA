import { notifyVerification } from "@/lib/account-recovery";
import { isDuplicateEntry } from "@/db/errors";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nannyApplications, users } from "@/db/schema";
import { getCurrentUser, hashPassword, signSession, sessionCookieName, sessionMaxAge } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const role = body.role === "nanny" ? "nanny" : "family";
    const name = role === "nanny"
      ? `${body.firstName?.trim() ?? ""} ${body.lastName?.trim() ?? ""}`.trim()
      : body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (await getCurrentUser({ allowUnverified: true })) {
      return NextResponse.json({ error: "You are already signed in. Log out before creating a separate account." }, { status: 409 });
    }

    if (!name || !email || !password || (role === "nanny" && (!body.firstName?.trim() || !body.lastName?.trim()))) {
      return NextResponse.json({ error: role === "nanny" ? "First name, last name, email, and password are required." : "Name, email, and password are required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password must be 128 characters or fewer." }, { status: 400 });
    }
    if (password !== body.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    }

    const user = { id: randomUUID(), role };
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: user.id, name, email, phone: role === "family" ? body.phone?.trim() || null : null, role, passwordHash: hashPassword(password) });
      if (role === "nanny") {
        await tx.insert(nannyApplications).values({
          userId: user.id,
          name,
          email,
          phone: null,
          bio: JSON.stringify({ version: 1, values: { firstName: body.firstName.trim(), lastName: body.lastName.trim(), email, country: "United States" }, references: [], workHistory: [], languages: [], attachments: [] }),
          status: "draft",
          subscriptionStatus: "inactive",
        });
      }
    });

    await notifyVerification(user.id);
    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set(sessionCookieName(), signSession(user.id, user.role), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionMaxAge(),
    });
    return res;
  } catch (error) {
    if (isDuplicateEntry(error)) return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    return NextResponse.json({ error: "Couldn't create your account. Please try again." }, { status: 500 });
  }
}
