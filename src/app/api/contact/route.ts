import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const message = body.message?.trim();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    await db.insert(contactMessages).values({
      name,
      email,
      phone: body.phone?.trim() || null,
      subject: body.subject?.trim() || null,
      message,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 500 });
  }
}
