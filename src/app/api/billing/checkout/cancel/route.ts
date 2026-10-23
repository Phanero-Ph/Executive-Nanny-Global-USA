import {NextResponse} from "next/server";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {users,stripeBilling} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {getStripe} from "@/lib/stripe";
export async function POST(req:Request){
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});if(user.role!=="family")return NextResponse.json({error:"A family account is required."},{status:403});
 try{const outcome=await db.transaction(async tx=>{
 await tx.select({id:users.id}).from(users).where(eq(users.id,user.id)).for("update");
 const [billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,user.id));
 if(!billing?.checkoutKey)return{status:200,alreadyCleared:true};
 if(!billing.checkoutSessionId)return{status:409,error:"Checkout is still opening. Please try again shortly."};
 const stripe=getStripe(),session=await stripe.checkout.sessions.retrieve(billing.checkoutSessionId);
 if(session.status==="complete")return{status:409,error:"Checkout completed. Manage your subscription through Manage billing."};
 if(session.status==="open")await stripe.checkout.sessions.expire(session.id);
 await tx.update(stripeBilling).set({checkoutKey:null,checkoutPlan:null,checkoutSessionId:null,updatedAt:new Date()}).where(eq(stripeBilling.userId,user.id));return{status:200};
 });return NextResponse.json(outcome.status===200?{ok:true}:{error:outcome.error},{status:outcome.status});}catch{return NextResponse.json({error:"Unable to cancel checkout. Please try again."},{status:502});}
}
