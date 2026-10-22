import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    await db
      .insert(newsletterSubscribers)
      .values({ email: email.trim().toLowerCase() })
      .onDuplicateKeyUpdate({ set: { email: email.trim().toLowerCase() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't subscribe right now. Please try again." }, { status: 500 });
  }
}
