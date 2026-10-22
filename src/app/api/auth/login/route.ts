import {adminIsActive} from "@/lib/admin-permissions";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requiresEmailVerification, verifyPassword, signSession, sessionCookieName, sessionMaxAge } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if(user.role==="admin"&&!await adminIsActive(user.id))return NextResponse.json({error:"This administrator account is not active. Contact your agency administrator."},{status:403});
    const res = NextResponse.json({ ok: true, role: user.role, requiresVerification:requiresEmailVerification(user) });
    res.cookies.set(sessionCookieName(), signSession(user.id, user.role, user.sessionVersion), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionMaxAge(),
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Couldn't log you in. Please try again." }, { status: 500 });
  }
}
