import type Stripe from "stripe";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { and,eq,sql } from "drizzle-orm";
import { db } from "@/db";
import { users,stripeBilling,membershipCycles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/mail";
import { getStripe,checkedPrice,stripeReady } from "@/lib/stripe";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});if(user.role!=="family")return NextResponse.json({error:"A family account is required."},{status:403});
 if(!stripeReady())return NextResponse.json({error:"Online subscriptions are being configured. Please contact our team."},{status:503});
 const body=await req.json().catch(()=>null);if(!body||typeof body.plan!=="string")return NextResponse.json({error:"Choose a membership plan."},{status:400});
 try{
 const stripe=getStripe(),plan=await checkedPrice(stripe,body.plan);
 const claim=await db.transaction(async tx=>{
 await tx.select({id:users.id}).from(users).where(eq(users.id,user.id)).for("update");
 let [billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,user.id));
 if(!billing){const customer=await stripe.customers.create({email:user.email,name:user.name,metadata:{egnUserId:user.id}},{idempotencyKey:`egn-customer-${user.id}`});await tx.insert(stripeBilling).values({userId:user.id,customerId:customer.id});[billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,user.id));}
 const manual=await tx.select({id:membershipCycles.id}).from(membershipCycles).where(and(eq(membershipCycles.userId,user.id),eq(membershipCycles.source,"manual"),sql`${membershipCycles.cancelledAt} IS NULL`,sql`${membershipCycles.endDate}>${new Date().toISOString().slice(0,10)}`)).limit(1);
 if(manual.length)return{error:"Your account has a manual membership. Contact our team before switching to Stripe.",status:409};
 const subscriptions=await stripe.subscriptions.list({customer:billing.customerId,status:"all",limit:100});
 if(subscriptions.has_more||subscriptions.data.some(s=>!["canceled","incomplete_expired"].includes(s.status)))return{error:"You already have a subscription. Use Manage billing to update it.",status:409};
 if(billing.checkoutKey){
 let session:Stripe.Checkout.Session|null=billing.checkoutSessionId?await stripe.checkout.sessions.retrieve(billing.checkoutSessionId):null;
 if(!session){const sessions=await stripe.checkout.sessions.list({customer:billing.customerId,limit:100});session=sessions.data.find(s=>s.metadata?.egnCheckout===billing.checkoutKey)??null;if(sessions.has_more&&!session)return{error:"Please contact our team to recover your checkout.",status:409};}
 if(session?.status==="complete")return{error:"Payment is being confirmed. Refresh your dashboard shortly.",status:409};
 if(!session||session.status==="open"){
 if(billing.checkoutPlan!==plan.name)return{error:"You have a checkout in progress for another plan. Complete or cancel that checkout first.",status:409};
 return{customer:billing.customerId,key:billing.checkoutKey,session};
 }
 }
 const key=randomUUID();await tx.update(stripeBilling).set({checkoutKey:key,checkoutPlan:plan.name,checkoutSessionId:null,updatedAt:new Date()}).where(eq(stripeBilling.userId,user.id));return{customer:billing.customerId,key,session:null};
 });
 if("error" in claim)return NextResponse.json({error:claim.error},{status:claim.status});
 const session=claim.session??await stripe.checkout.sessions.create({mode:"subscription",customer:claim.customer,client_reference_id:user.id,allowed_payment_method_types:["card"],line_items:[{price:plan.priceId,quantity:1}],success_url:appUrl("/dashboard/family?billing=success"),cancel_url:appUrl("/dashboard/family?billing=cancelled"),expires_at:Math.floor(Date.now()/1000)+30*60,metadata:{egnUserId:user.id,egnCheckout:claim.key},subscription_data:{metadata:{egnUserId:user.id,egnCheckout:claim.key}}},{idempotencyKey:`egn-checkout-${claim.key}`});
 await db.update(stripeBilling).set({checkoutSessionId:session.id,updatedAt:new Date()}).where(and(eq(stripeBilling.userId,user.id),eq(stripeBilling.checkoutKey,claim.key)));
 if(!session.url)throw new Error("Checkout URL unavailable.");return NextResponse.json({url:session.url});
 }catch{console.error("Stripe checkout could not be created.");return NextResponse.json({error:"Unable to open checkout. Please try again or contact our team."},{status:502});}
}
