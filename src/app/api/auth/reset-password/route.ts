import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { and,eq,gt,isNull,sql } from "drizzle-orm";
import { db } from "@/db";
import { accountTokens,users } from "@/db/schema";
import { hashPassword,sessionCookieName } from "@/lib/auth";
export async function POST(req:Request) {
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 try {
  const {token,password,confirmPassword}=await req.json();
  if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"This link is invalid or expired."},{status:400});
  if(typeof password!=="string"||password.length<8||password.length>128||password!==confirmPassword)return NextResponse.json({error:"Use matching passwords between 8 and 128 characters."},{status:400});
  const hash=createHash("sha256").update(token).digest("hex");
  const changed=await db.transaction(async tx=>{
   const [entry]=await tx.select().from(accountTokens).where(and(eq(accountTokens.tokenHash,hash),eq(accountTokens.purpose,"reset"),isNull(accountTokens.usedAt),gt(accountTokens.expiresAt,new Date()))).for("update");
   if(!entry)return false;
   await tx.update(users).set({passwordHash:hashPassword(password),sessionVersion:sql`${users.sessionVersion} + 1`,updatedAt:new Date()}).where(eq(users.id,entry.userId));
   await tx.update(accountTokens).set({usedAt:new Date()}).where(and(eq(accountTokens.userId,entry.userId),eq(accountTokens.purpose,"reset"),isNull(accountTokens.usedAt)));
   return true;
  });
  if(!changed)return NextResponse.json({error:"This link is invalid or expired. Request a new one."},{status:400});
  const response=NextResponse.json({ok:true});response.cookies.set(sessionCookieName(),"",{path:"/",maxAge:0});return response;
 }catch{return NextResponse.json({error:"Could not reset your password."},{status:500});}
}
