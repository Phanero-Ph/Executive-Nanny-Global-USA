import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
export async function PATCH(req: Request) {
 if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
 if (user.role !== "family") return NextResponse.json({ error: "A family account is required." }, { status: 403 });
 try {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!name || name.length > 255 || phone.length > 50) return NextResponse.json({ error: "Enter a name up to 255 characters and a phone number up to 50 characters." }, { status: 400 });
  await db.update(users).set({ name, phone: phone || null, updatedAt: new Date() }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
 } catch { return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 }); }
}
