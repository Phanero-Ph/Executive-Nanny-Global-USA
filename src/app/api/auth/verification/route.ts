import { NextResponse } from "next/server";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { createHash } from "node:crypto";
import { and,eq,gt,isNull,sql } from "drizzle-orm";
import { db } from "@/db";
import { accountTokens,users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { issueAccountToken,recoveryAllowed } from "@/lib/account-recovery";
export async function POST(req:Request) {
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 try {
  const body=await req.json();
  if(body.action==="resend") {
   const user=await getCurrentUser({allowUnverified:true});if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
   if(!user.emailVerifiedAt&&await recoveryAllowed(user.email))await issueAccountToken(user.id,"verify");
   return NextResponse.json({ok:true});
  }
  if(typeof body.token!=="string"||!/^[a-f0-9]{64}$/.test(body.token))return NextResponse.json({error:"This verification link is invalid or expired."},{status:400});
  const hash=createHash("sha256").update(body.token).digest("hex");
  const verified=await db.transaction(async tx=>{
   const [entry]=await tx.select().from(accountTokens).where(and(eq(accountTokens.tokenHash,hash),eq(accountTokens.purpose,"verify"),isNull(accountTokens.usedAt),gt(accountTokens.expiresAt,new Date()))).for("update");
   if(!entry)return false;
   // Revoke the pre-verification session. The user must sign in after verifying.
   await tx.update(users).set({emailVerifiedAt:new Date(),sessionVersion:sql`${users.sessionVersion}+1`}).where(eq(users.id,entry.userId));
   await tx.update(accountTokens).set({usedAt:new Date()}).where(and(eq(accountTokens.userId,entry.userId),eq(accountTokens.purpose,"verify"),isNull(accountTokens.usedAt)));return true;
  });
  return verified?NextResponse.json({ok:true}):NextResponse.json({error:"This verification link is invalid or expired."},{status:400});
 }catch{return NextResponse.json({error:"Could not verify your email."},{status:500});}
}
