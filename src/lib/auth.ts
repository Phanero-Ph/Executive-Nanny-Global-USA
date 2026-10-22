import {adminIsActive} from "./admin-permissions";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const SESSION_COOKIE = "egn_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32)) {
    throw new Error("Production requires a SESSION_SECRET of at least 32 characters.");
  }
  return configured || "dev-secret-change-in-production";
}

function b64urlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function b64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

/* ------------------------------- Password hashing ------------------------------ */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* --------------------------------- Sessions ----------------------------------- */

export type SessionPayload = { uid: string; role: string; exp: number; version?: number };

export function signSession(userId: string, role: string, version = 0): string {
  const payload = b64urlEncode(
    JSON.stringify({ uid: userId, role, version, exp: Date.now() + SESSION_TTL_MS } satisfies SessionPayload),
  );
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(b64urlDecode(payload)) as SessionPayload;
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session) return null;
  const [user] = await db.select({ version: users.sessionVersion }).from(users).where(eq(users.id, session.uid)).limit(1);
  return user && user.version === (session.version ?? 0) ? session : null;
}

export function requiresEmailVerification(user:Pick<User,"role"|"emailVerifiedAt">){return ["family","nanny"].includes(user.role)&&!user.emailVerifiedAt;}

// Dashboard APIs require verification by default. Only onboarding and recovery may opt out.
export async function getCurrentUser({allowUnverified=false}:{allowUnverified?:boolean}={}): Promise<User | null> {
  try {
    const session = await getSession();
    if (!session) return null;
    const rows = await db.select().from(users).where(eq(users.id, session.uid)).limit(1);
    const user=rows[0];
    if(user?.role==="admin"&&!await adminIsActive(user.id))return null;
    return user&&(allowUnverified||!requiresEmailVerification(user))?user:null;
  } catch {
    return null;
  }
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}

export function sessionMaxAge(): number {
  return Math.floor(SESSION_TTL_MS / 1000);
}

export function safeUser(user: User): { id: string; name: string; email: string; role: string; phone: string | null } {
  return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
}
