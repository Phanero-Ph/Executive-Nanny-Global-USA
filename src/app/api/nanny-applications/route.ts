import { notifySubmission } from "@/lib/mail";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { nannyApplications } from "@/db/schema";
import { getCurrentUser, requiresEmailVerification } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const account=await getCurrentUser({allowUnverified:true});
    if(account&&requiresEmailVerification(account))return NextResponse.json({error:"Verify your email address before submitting an application."},{status:403});
    if(account&&account.role!=="nanny")return NextResponse.json({error:"A nanny account is required."},{status:403});
    const body = (await req.json()) as Record<string, string>;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    const city = body.city?.trim();
    const services = body.services?.trim();

    if (!name || !email || !phone || !city || !services) {
      return NextResponse.json({ error: "Please complete all required steps." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const exp = Number.parseInt(body.experienceYears ?? "", 10);
    await db.insert(nannyApplications).values({
      userId: account?.id ?? null,
      name,
      email,
      phone,
      city,
      experienceYears: Number.isFinite(exp) ? exp : null,
      certifications: body.certifications?.trim() || null,
      availability: body.availability?.trim() || null,
      services,
      bio: body.bio?.trim() || null,
      status: "submitted",
      subscriptionStatus: "inactive",
    });
    await notifySubmission(account?.id ?? null, email, "nanny");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't submit your application. Please try again." }, { status: 500 });
  }
}
