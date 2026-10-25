import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const account=await getCurrentUser({allowUnverified:true});
  if(!account)return NextResponse.json({error:"Create a nanny account and complete your application from the dashboard."},{status:410});
  return NextResponse.json({error:"Please complete and submit your application from your nanny dashboard."},{status:410});
}
