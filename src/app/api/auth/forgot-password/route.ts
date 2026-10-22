import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isValidEmail } from "@/lib/utils";
import { recoveryAllowed, issueAccountToken } from "@/lib/account-recovery";
export async function POST(req: Request) {
 if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error:"Request origin not allowed." },{status:403});
 try {
  const body=await req.json();const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if (!isValidEmail(email) || email.length>254) return NextResponse.json({error:"Enter a valid email address."},{status:400});
  if (await recoveryAllowed(email)) {
   const [user]=await db.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
   if(user) await issueAccountToken(user.id,"reset");
  }
  return NextResponse.json({ok:true,message:"If an account exists for that address, a password-reset email will be sent."});
 }catch{return NextResponse.json({error:"Could not process this request. Please try again."},{status:500});}
}
