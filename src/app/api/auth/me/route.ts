import { NextResponse } from "next/server";
import { getCurrentUser, requiresEmailVerification, safeUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser({allowUnverified:true});
  return NextResponse.json({ user: user ? {...safeUser(user),requiresVerification:requiresEmailVerification(user)} : null });
}
