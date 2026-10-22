import { processCaregiverFeeEvent } from "./caregiver-fee-events";
import type Stripe from "stripe";
import { and,eq,sql } from "drizzle-orm";
import { db } from "@/db";
import { stripeBilling,stripeEvents,users,membershipCycles,membershipPayments,mailJobs } from "@/db/schema";
import { getStripe,stripePrices,stripeMode } from "./stripe";
import { appUrl } from "./mail";
const idOf=(value:string|{id:string}|null|undefined)=>typeof value==="string"?value:value?.id;
export const STRIPE_EVENTS=["checkout.session.completed","checkout.session.expired","customer.subscription.created","customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed","charge.refunded"];
export async function processStripeEvent(event:Stripe.Event){
 if(!STRIPE_EVENTS.includes(event.type))return;
 if(event.livemode!==(stripeMode()==="live"))throw new Error("Stripe event mode mismatch.");
 const stripe=getStripe();
 if(await processCaregiverFeeEvent(event,stripe))return;
 const object=event.data.object as Stripe.Subscription|Stripe.Invoice|Stripe.Checkout.Session|Stripe.Charge;
 const customer=idOf(object.customer);if(!customer)return;
 const [owner]=await db.select().from(stripeBilling).where(eq(stripeBilling.customerId,customer));if(!owner)return;
 await db.transaction(async tx=>{
 const [family]=await tx.select().from(users).where(eq(users.id,owner.userId)).for("update");
 if(!family||family.role!=="family")throw new Error("Billing account unavailable.");
 const [billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,family.id)).for("update");
 const [seen]=await tx.select({id:stripeEvents.id}).from(stripeEvents).where(eq(stripeEvents.id,event.id));if(seen)return;
 let subId:string|undefined;
 let invoice:Stripe.Invoice|null=null;
 if(event.type.startsWith("invoice.")){invoice=await stripe.invoices.retrieve(object.id);subId=idOf(invoice.parent?.subscription_details?.subscription);}
 else if(event.type.startsWith("customer.subscription."))subId=object.id;
 else if(event.type==="checkout.session.completed"){
 const session=await stripe.checkout.sessions.retrieve(object.id);if(session.customer!==customer||session.client_reference_id!==family.id)throw new Error("Checkout owner mismatch.");subId=idOf(session.subscription);
 }else if(event.type==="checkout.session.expired"){
 if(billing.checkoutSessionId===object.id)await tx.update(stripeBilling).set({checkoutKey:null,checkoutPlan:null,checkoutSessionId:null,updatedAt:new Date()}).where(eq(stripeBilling.userId,family.id));
 }else if(event.type==="charge.refunded"){
 const charge=await stripe.charges.retrieve(object.id);const intent=idOf(charge.payment_intent);
 if(intent){const payments=await stripe.invoicePayments.list({payment:{type:"payment_intent",payment_intent:intent},limit:100});if(payments.has_more)throw new Error("Too many invoice payments.");
 for(const payment of payments.data){const invoiceId=idOf(payment.invoice);if(!invoiceId)continue;
 const [cycle]=await tx.select().from(membershipCycles).where(and(eq(membershipCycles.stripeInvoiceId,invoiceId),eq(membershipCycles.userId,family.id)));
 if(cycle){const charges=await stripe.charges.list({payment_intent:intent,limit:100});if(charges.has_more)throw new Error("Too many payment charges.");const refunded=charges.data.reduce((sum,c)=>sum+c.amount_refunded,0);
 await tx.update(membershipPayments).set({refundedCents:Math.min(refunded,cycle.amountCents)}).where(and(eq(membershipPayments.cycleId,cycle.id),eq(membershipPayments.reference,invoiceId)));}
 }}
 }
 if(subId){
 // Read current Stripe state while holding the account lock; event order cannot restore stale status.
 const sub=await stripe.subscriptions.retrieve(subId);
 if(idOf(sub.customer)!==customer||sub.metadata.egnUserId!==family.id)throw new Error("Subscription owner mismatch.");
 const item=sub.items.data[0],plan=stripePrices().find(p=>p.priceId===item?.price.id);
 if(sub.items.data.length!==1||!plan||item.quantity!==1||item.price.currency!=="usd"||item.price.unit_amount!==plan.amountCents||item.price.recurring?.interval!=="month"||item.price.recurring.interval_count!==1)throw new Error("Unsupported subscription price.");
 let update=true;
 if(billing.subscriptionId&&billing.subscriptionId!==sub.id){const current=await stripe.subscriptions.retrieve(billing.subscriptionId);update=["canceled","incomplete_expired"].includes(current.status);}
 if(update)await tx.update(stripeBilling).set({subscriptionId:sub.id,status:sub.status,plan:plan.name,periodEnd:new Date(item.current_period_end*1000),cancelAtPeriodEnd:sub.cancel_at_period_end?1:0,checkoutKey:null,checkoutPlan:null,checkoutSessionId:null,updatedAt:new Date()}).where(eq(stripeBilling.userId,family.id));
 if(invoice&&invoice.status==="paid"&&["subscription_create","subscription_cycle"].includes(invoice.billing_reason??"")){
 if(idOf(invoice.customer)!==customer||invoice.currency!=="usd"||invoice.amount_paid!==plan.amountCents||invoice.total!==plan.amountCents||invoice.lines.has_more)throw new Error("Invoice amount mismatch.");
 const line=invoice.lines.data.find(l=>idOf(l.pricing?.price_details?.price)===item.price.id&&l.parent?.subscription_item_details&&!l.parent.subscription_item_details.proration);
 if(!line||line.quantity!==1||line.period.end<=line.period.start)throw new Error("Invoice period unavailable.");
 const start=new Date(line.period.start*1000),end=new Date(line.period.end*1000);
 const [existing]=await tx.select().from(membershipCycles).where(eq(membershipCycles.stripeInvoiceId,invoice.id));
 if(!existing){
 const [result]=await tx.insert(membershipCycles).values({userId:family.id,plan:plan.name,amountCents:plan.amountCents,startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10),periodStart:start,periodEnd:end,source:"stripe",stripeInvoiceId:invoice.id,createdBy:family.id,cancelledAt:sub.status==="canceled"?new Date():null}).$returningId();
 let refunded=0;const invoicePayments=await stripe.invoicePayments.list({invoice:invoice.id,status:"paid",limit:100});if(invoicePayments.has_more)throw new Error("Too many invoice payments.");
 for(const payment of invoicePayments.data){const intent=idOf(payment.payment.payment_intent);if(intent){const charges=await stripe.charges.list({payment_intent:intent,limit:100});if(charges.has_more)throw new Error("Too many charges.");refunded+=charges.data.reduce((sum,c)=>sum+c.amount_refunded,0);}}
 await tx.insert(membershipPayments).values({cycleId:result.id,amountCents:invoice.amount_paid,refundedCents:Math.min(refunded,invoice.amount_paid),reference:invoice.id,method:"stripe",paidDate:new Date((invoice.status_transitions.paid_at??event.created)*1000).toISOString().slice(0,10),recordedBy:family.id});
 await tx.insert(mailJobs).values({userId:family.id,recipient:family.email,subject:"Your membership payment succeeded",body:`Your ${plan.name} membership payment was confirmed by Stripe. View your membership and manage billing: ${appUrl("/dashboard/family")}\n\nExecutive Global Nanny`});
 }
 }
 if(sub.status==="canceled"){
 // Apply only to this subscription's invoices, never a newer subscription or manual membership.
 const invoices=await stripe.invoices.list({subscription:sub.id,limit:100});
 for(const invoice of invoices.data)await tx.update(membershipCycles).set({cancelledAt:new Date()}).where(and(eq(membershipCycles.stripeInvoiceId,invoice.id),eq(membershipCycles.userId,family.id),sql`${membershipCycles.periodEnd}>${new Date()}`));
 }
 }
 await tx.insert(stripeEvents).values({id:event.id,type:event.type});
 });
}
