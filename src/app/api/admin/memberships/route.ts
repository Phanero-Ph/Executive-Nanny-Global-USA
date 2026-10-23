import {adminCan} from "@/lib/admin-permissions";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { NextResponse } from "next/server";
import { and,eq,sql } from "drizzle-orm";
import { db } from "@/db";
import { users,membershipCycles,membershipPayments,mailJobs,stripeBilling } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isDuplicateEntry } from "@/db/errors";
import { MEMBERSHIP_PLANS,validDate,nextMonth,money } from "@/lib/membership";
import { appUrl } from "@/lib/mail";
export async function POST(req:Request) {
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(actor,"payments.manage"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 try {
 const body=await req.json().catch(()=>null);if(!body || typeof body!=="object")return NextResponse.json({error:"Invalid request."},{status:400});if(!["create","payment","void","cancel"].includes(body.action))return NextResponse.json({error:"Invalid action."},{status:400});
 const plan=MEMBERSHIP_PLANS.find(plan=>plan.name===body.plan);
 if(body.action==="create" && (!plan || !validDate(body.startDate) || typeof body.userId!=="string"))return NextResponse.json({error:"Choose a family, plan and valid start date."},{status:400});
 if(body.action!=="create" && (typeof body.cycleId!=="string" || !Number.isInteger(body.revision)))return NextResponse.json({error:"Invalid cycle or revision."},{status:400});
 if(body.action==="payment" && (!Number.isInteger(body.amountCents)||body.amountCents<=0||body.amountCents>20000||typeof body.reference!=="string"||!body.reference.trim()||body.reference.length>100||!["bank_transfer","cash","check","other"].includes(body.method)||!validDate(body.paidDate)||body.paidDate>new Date().toISOString().slice(0,10)))return NextResponse.json({error:"Enter a valid amount, payment date, method and unique reference."},{status:400});
 if(body.action==="void" && (typeof body.paymentId!=="string"||typeof body.reason!=="string"||!body.reason.trim()||body.reason.length>500))return NextResponse.json({error:"Select a receipt and provide a correction reason."},{status:400});
 const [existing]=body.action==="create"?[]:await db.select().from(membershipCycles).where(eq(membershipCycles.id,body.cycleId)).limit(1);
 if(body.action!=="create"&&!existing)return NextResponse.json({error:"Membership not found."},{status:404});
 const outcome=await db.transaction(async tx=>{
 const [family]=await tx.select().from(users).where(eq(users.id,existing?.userId??body.userId)).for("update");
 if(!family||family.role!=="family")return{status:404,error:"Family account not found."};
 let cycle=existing;
 if(body.action==="create") {
 const [billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,family.id));
 if(billing&&(billing.checkoutKey||!["none","canceled","incomplete_expired"].includes(billing.status)))return{status:409,error:"This family uses Stripe billing. Manage its subscription through Stripe."};
 const endDate=nextMonth(body.startDate);
 const overlaps=await tx.select({id:membershipCycles.id}).from(membershipCycles).where(and(eq(membershipCycles.userId,family.id),sql`${membershipCycles.cancelledAt} IS NULL`,sql`${membershipCycles.startDate} < ${endDate}`,sql`${membershipCycles.endDate} > ${body.startDate}`)).limit(1);
 if(overlaps.length)return{status:409,error:"This family already has a membership for these dates."};
 const [created]=await tx.insert(membershipCycles).values({userId:family.id,plan:plan!.name,amountCents:plan!.amountCents,startDate:body.startDate,endDate,createdBy:actor.id}).$returningId();return{status:200,id:created.id};
 }
 [cycle]=await tx.select().from(membershipCycles).where(eq(membershipCycles.id,body.cycleId)).for("update");
 if(!cycle||cycle.revision!==body.revision)return{status:409,error:"Membership changed. Refresh before saving."};
 if(cycle.source==="stripe")return{status:409,error:"Stripe payments and cancellations must be managed through Stripe."};
 if(cycle.cancelledAt)return{status:409,error:"This membership has been cancelled."};
 const receipts=await tx.select().from(membershipPayments).where(eq(membershipPayments.cycleId,cycle.id));
 const paid=receipts.filter(r=>!r.voidedAt).reduce((sum,r)=>sum+r.amountCents,0);
 if(body.action==="payment") {
 if(paid+body.amountCents>cycle.amountCents)return{status:409,error:"Payment exceeds the outstanding membership balance."};
 await tx.insert(membershipPayments).values({cycleId:cycle.id,amountCents:body.amountCents,reference:body.reference.trim(),method:body.method,paidDate:body.paidDate,recordedBy:actor.id});
 await tx.insert(mailJobs).values({userId:family.id,recipient:family.email,subject:"Membership payment recorded",body:`We recorded ${money(body.amountCents)} toward your ${cycle.plan} membership for ${cycle.startDate} to ${cycle.endDate} (exclusive). Remaining balance: ${money(cycle.amountCents-paid-body.amountCents)}.\n\nView your membership: ${appUrl("/dashboard/family")}\n\nExecutive Global Nanny`});
 }else if(body.action==="void") {
 const receipt=receipts.find(r=>r.id===body.paymentId&&!r.voidedAt);if(!receipt)return{status:409,error:"Receipt not found or already voided."};
 await tx.update(membershipPayments).set({voidedAt:new Date(),voidedBy:actor.id,voidReason:body.reason.trim()}).where(eq(membershipPayments.id,receipt.id));
 await tx.insert(mailJobs).values({userId:family.id,recipient:family.email,subject:"Membership payment correction",body:`A ${money(receipt.amountCents)} membership receipt was corrected. Please view your updated balance: ${appUrl("/dashboard/family")}\n\nContact our team if you have questions.`});
 }else {
 if(paid>0)return{status:409,error:"Resolve recorded payments before cancelling. Voiding corrects records; it does not issue a refund."};
 await tx.update(membershipCycles).set({cancelledAt:new Date()}).where(eq(membershipCycles.id,cycle.id));
 }
 await tx.update(membershipCycles).set({revision:sql`${membershipCycles.revision}+1`}).where(eq(membershipCycles.id,cycle.id));return{status:200,id:cycle.id};
 });return NextResponse.json(outcome.status===200?{ok:true,id:outcome.id}:{error:outcome.error},{status:outcome.status});
 }catch(error){return NextResponse.json({error:isDuplicateEntry(error)?"This payment reference is already recorded.":"Could not save membership."},{status:isDuplicateEntry(error)?409:500});}
}
