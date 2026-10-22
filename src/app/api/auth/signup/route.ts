import { notifyVerification } from "@/lib/account-recovery";
import { isDuplicateEntry } from "@/db/errors";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, signSession, sessionCookieName, sessionMaxAge } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const role = body.role === "nanny" ? "nanny" : "family";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
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
    await db
      .insert(users)
      .values({ id: user.id, name, email, phone: body.phone?.trim() || null, role, passwordHash: hashPassword(password) });

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
