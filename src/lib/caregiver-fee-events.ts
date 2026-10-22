import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { caregiverFees, familyRequests, stripeEvents, mailJobs } from "@/db/schema";
import {feeMoney} from "./fee-format";
import { appUrl } from "./mail";

/** Reconcile a completed checkout on read if Stripe's webhook was delayed or missed. */
export async function syncCaregiverFeeCheckout(requestId:string){
 const [request]=await db.select().from(familyRequests).where(eq(familyRequests.id,requestId));
 const [fee]=await db.select().from(caregiverFees).where(and(eq(caregiverFees.requestId,requestId),eq(caregiverFees.kind,"placement")));
 if(!request||!fee||fee.paidAt||!fee.checkoutSessionId||fee.status!=="checkout_pending")return;
 try{
  const stripe=(await import("./stripe")).getStripe();
  const session=await stripe.checkout.sessions.retrieve(fee.checkoutSessionId);
  if(session.status!=="complete"||session.payment_status!=="paid")return;
  const metadata=session.metadata;
  if(session.mode!=="payment"||session.currency!=="usd"||session.amount_total!==fee.amountCents||session.client_reference_id!==request.userId||metadata?.egnPurpose!=="caregiver_fee"||metadata.egnRequestId!==request.id||metadata.egnUserId!==request.userId||metadata.egnFeeId!==fee.id||metadata.egnFeeKind!=="placement"||metadata.egnFeeKey!==fee.checkoutKey)throw new Error("Placement fee checkout ownership or amount mismatch.");
  const intentId=typeof session.payment_intent==="string"?session.payment_intent:session.payment_intent?.id;
  if(!intentId)throw new Error("Placement fee payment intent missing.");
  const intent=await stripe.paymentIntents.retrieve(intentId);
  if(intent.status!=="succeeded"||intent.currency!=="usd"||intent.amount_received!==fee.amountCents||intent.metadata.egnFeeId!==fee.id)throw new Error("Placement fee payment is not confirmed.");
  const charges=await stripe.charges.list({payment_intent:intentId,limit:100});
  if(charges.has_more)throw new Error("Too many placement fee charges.");
  const refunded=charges.data.reduce((sum,charge)=>sum+charge.amount_refunded,0),status=refunded>0?"refunded":"paid";
  await db.transaction(async tx=>{
   const [currentRequest]=await tx.select().from(familyRequests).where(eq(familyRequests.id,request.id)).for("update");
   const [currentFee]=await tx.select().from(caregiverFees).where(eq(caregiverFees.id,fee.id)).for("update");
   if(!currentRequest||!currentFee||currentFee.checkoutSessionId!==session.id||currentFee.checkoutKey!==metadata.egnFeeKey||currentFee.paidAt)return;
   await tx.update(caregiverFees).set({status,checkoutSessionId:session.id,paymentIntentId:intentId,paidAt:new Date(session.created*1000),refundedCents:refunded}).where(eq(caregiverFees.id,currentFee.id));
   await tx.update(familyRequests).set({placementFeeStatus:status}).where(eq(familyRequests.id,currentRequest.id));
   await tx.insert(mailJobs).values({userId:currentRequest.userId,recipient:currentRequest.email,subject:"Your nanny fee payment was confirmed",body:`Your ${feeMoney(currentFee.amountCents)} placement fee has been received. View your care request: ${appUrl("/dashboard/family?view=caregiver")}\n\nExecutive Global Nanny`});
  });
 }catch(error){
  // A transient Stripe/network error should not prevent the family from viewing
  // their dashboard. The next fee refresh or Stripe webhook will retry.
  console.error("Placement fee checkout reconciliation failed.",error instanceof Error?error.message:"unknown error");
 }
}

// Returns true only for this application's request-fee events. Subscription
// checkout and refund events continue to the existing membership handler.
export async function processCaregiverFeeEvent(event: Stripe.Event, stripe: Stripe) {
 if (event.type === "charge.refunded") {
  const charge = await stripe.charges.retrieve(event.data.object.id);
  const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!intent) return false;
  const [fee] = await db.select().from(caregiverFees).where(eq(caregiverFees.paymentIntentId,intent));
  if (!fee) return false;
  await db.transaction(async tx=>{
   await tx.select().from(familyRequests).where(eq(familyRequests.id,fee.requestId)).for("update");
   const [seen] = await tx.select().from(stripeEvents).where(eq(stripeEvents.id,event.id)); if (seen) return;
  const charges = await stripe.charges.list({payment_intent:intent,limit:100});
  if (charges.has_more) throw new Error("Too many fee charges.");
  const refunded = charges.data.reduce((sum,c)=>sum+c.amount_refunded,0);
   await tx.update(caregiverFees).set({refundedCents:refunded,status:refunded>0?"refunded":"paid"}).where(eq(caregiverFees.id,fee.id));
   await tx.update(familyRequests).set(fee.kind==="search"?{searchFeeStatus:refunded>0?"refunded":"paid"}:{placementFeeStatus:refunded>0?"refunded":"paid"}).where(eq(familyRequests.id,fee.requestId));
   await tx.insert(stripeEvents).values({id:event.id,type:event.type});
  });
  return true;
 }
 if (!["checkout.session.completed","checkout.session.expired"].includes(event.type)) return false;
 const session = await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id);
 if (session.metadata?.egnPurpose !== "caregiver_fee") return false;
 await db.transaction(async tx=>{
  const [request] = await tx.select().from(familyRequests).where(eq(familyRequests.id,session.metadata!.egnRequestId)).for("update");
  const [fee] = await tx.select().from(caregiverFees).where(eq(caregiverFees.id,session.metadata!.egnFeeId)).for("update");
  const [seen] = await tx.select().from(stripeEvents).where(eq(stripeEvents.id,event.id)); if (seen) return;
  if(fee&&request&&event.type==="checkout.session.expired"&&fee.checkoutKey!==session.metadata!.egnFeeKey){
   await tx.insert(stripeEvents).values({id:event.id,type:event.type});return;
  }
  if (!request || request.careCategory!=="caregiver" || !fee || fee.requestId!==request.id || fee.kind!==session.metadata!.egnFeeKind || request.userId!==session.client_reference_id || request.userId!==session.metadata!.egnUserId || fee.checkoutKey!==session.metadata!.egnFeeKey) throw new Error("Fee checkout ownership mismatch.");
  if (fee.checkoutSessionId && fee.checkoutSessionId!==session.id) throw new Error("Fee checkout mismatch.");
  if (event.type==="checkout.session.completed") {
   if (session.mode!=="payment" || session.payment_status!=="paid" || session.currency!=="usd" || session.amount_total!==fee.amountCents) throw new Error("Fee payment is not confirmed.");
   const intentId = typeof session.payment_intent==="string"?session.payment_intent:session.payment_intent?.id;
   if (!intentId) throw new Error("Fee payment intent missing.");
   const intent = await stripe.paymentIntents.retrieve(intentId);
   if (intent.status!=="succeeded" || intent.currency!=="usd" || intent.amount_received!==fee.amountCents || intent.metadata.egnFeeId!==fee.id) throw new Error("Fee payment mismatch.");
   const charges = await stripe.charges.list({payment_intent:intentId,limit:100});
   if (charges.has_more) throw new Error("Too many fee charges.");
   const refunded=charges.data.reduce((sum,c)=>sum+c.amount_refunded,0), status=refunded>0?"refunded":"paid";
   await tx.update(caregiverFees).set({status,checkoutSessionId:session.id,paymentIntentId:intentId,paidAt:fee.paidAt??new Date(event.created*1000),refundedCents:refunded}).where(eq(caregiverFees.id,fee.id));
   await tx.update(familyRequests).set(fee.kind==="search"?{searchFeeStatus:status,...(["lead","search_fee_invoiced"].includes(request.status)&&status==="paid"?{status:"search_fee_paid"}:{})}:{placementFeeStatus:status}).where(eq(familyRequests.id,request.id));
   if (!fee.paidAt) await tx.insert(mailJobs).values({userId:request.userId,recipient:request.email,subject:"Your nanny fee payment was confirmed",body:`Your ${feeMoney(fee.amountCents)} ${fee.kind} fee has been received. View your care request: ${appUrl("/dashboard/family?view=caregiver")}\n\nExecutive Global Nanny`});
  } else if (!fee.paidAt) {
   // A new attempt gets a new idempotency key; stale expiry events cannot
   // invalidate a later checkout because its metadata key must match above.
   await tx.update(caregiverFees).set({status:"expired",checkoutSessionId:session.id}).where(and(eq(caregiverFees.id,fee.id),eq(caregiverFees.checkoutKey,session.metadata!.egnFeeKey)));
  }
  await tx.insert(stripeEvents).values({id:event.id,type:event.type});
 });
 return true;
}
