import {getAgencyFees} from "@/lib/agency-fees";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {and,eq} from "drizzle-orm";
import {db} from "@/db";
import {caregiverFees,familyRequests,stripeBilling,users,nannyMatches} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {getStripe} from "@/lib/stripe";
import {appUrl} from "@/lib/mail";
import {PlacementError} from "@/lib/placement-policy";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 if(user.role!=="family")return NextResponse.json({error:"A family account is required."},{status:403});
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.requestId!=="string"||!["search","placement"].includes(body.kind))return NextResponse.json({error:"Choose a request and fee."},{status:400});
 try{
  const stripe=getStripe();
  const claim=await db.transaction(async tx=>{
   const [request]=await tx.select().from(familyRequests).where(and(eq(familyRequests.id,body.requestId),eq(familyRequests.userId,user.id))).for("update");
   if(!request)throw new PlacementError("Request not found.",404);
   if(request.careCategory!=="caregiver")throw new PlacementError("Babysitter search and placement fees are included in the subscription.");
   if(["closed","cancelled","placed"].includes(request.status))throw new PlacementError("This request is no longer awaiting payment.");
   if(body.kind==="placement"&&(request.searchFeeStatus!=="paid"||request.status!=="placement_fee_due"))throw new PlacementError("Your recruiter must select a shortlisted nanny and publish the salary-based quote before the placement fee can be paid.");
   await tx.select({id:users.id}).from(users).where(eq(users.id,user.id)).for("update");
   let [billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,user.id));
   if(!billing){
    const customer=await stripe.customers.create({email:user.email,name:user.name,metadata:{egnUserId:user.id}},{idempotencyKey:`egn-customer-${user.id}`});
    await tx.insert(stripeBilling).values({userId:user.id,customerId:customer.id});
    [billing]=await tx.select().from(stripeBilling).where(eq(stripeBilling.userId,user.id));
   }
   let [fee]=await tx.select().from(caregiverFees).where(and(eq(caregiverFees.requestId,request.id),eq(caregiverFees.kind,body.kind))).for("update");
   if(body.kind==="placement"){
    if(!fee)throw new PlacementError("Your agency must issue a salary-based placement quote before payment.");
    if(fee.annualSalaryCents!==null){const [candidate]=await tx.select({id:nannyMatches.id}).from(nannyMatches).where(and(eq(nannyMatches.id,fee.matchId??""),eq(nannyMatches.familyRequestId,request.id),eq(nannyMatches.status,"shortlisted")));if(!candidate)throw new PlacementError("This placement quote is no longer available. Contact the agency.");}
   }
   if(fee?.paidAt)throw new PlacementError(fee.status==="paid"?"This fee has already been paid.":"This fee was refunded. Contact the agency before paying again.");
   if(fee?.checkoutSessionId){
    const session=await stripe.checkout.sessions.retrieve(fee.checkoutSessionId);
    if(session.status==="complete")throw new PlacementError("Stripe is confirming this fee. Refresh your requests shortly.");
    if(session.status==="open")return{fee,customer:billing.customerId,session};
    await tx.update(caregiverFees).set({checkoutKey:randomUUID(),checkoutSessionId:null,status:"unpaid"}).where(eq(caregiverFees.id,fee.id));
    [fee]=await tx.select().from(caregiverFees).where(eq(caregiverFees.id,fee.id));
   }
   if(!fee){
    const prices=await getAgencyFees(tx);
    const [created]=await tx.insert(caregiverFees).values({requestId:request.id,kind:body.kind,amountCents:prices.searchCents,checkoutKey:randomUUID()}).$returningId();
    [fee]=await tx.select().from(caregiverFees).where(eq(caregiverFees.id,created.id));
   }
   await tx.update(caregiverFees).set({status:"checkout_pending"}).where(eq(caregiverFees.id,fee.id));
   return{fee,customer:billing.customerId,session:null};
  });
  const metadata={egnPurpose:"caregiver_fee",egnRequestId:body.requestId,egnUserId:user.id,egnFeeId:claim.fee.id,egnFeeKind:claim.fee.kind,egnFeeKey:claim.fee.checkoutKey};
  const session=claim.session??await stripe.checkout.sessions.create({
   mode:"payment",adaptive_pricing:{enabled:false},automatic_tax:{enabled:false},customer:claim.customer,client_reference_id:user.id,allowed_payment_method_types:["card"],
   line_items:[{price_data:{currency:"usd",unit_amount:claim.fee.amountCents,product_data:{name:`Nanny ${claim.fee.kind} fee`}},quantity:1}],
   metadata,payment_intent_data:{metadata},success_url:appUrl(`/dashboard/family?view=caregiver&fee=success&requestId=${encodeURIComponent(body.requestId)}`),cancel_url:appUrl(`/dashboard/family?view=caregiver&fee=cancelled&requestId=${encodeURIComponent(body.requestId)}`),
  },{idempotencyKey:`egn-caregiver-fee-${claim.fee.id}-${claim.fee.checkoutKey}`});
  await db.update(caregiverFees).set({checkoutSessionId:session.id}).where(and(eq(caregiverFees.id,claim.fee.id),eq(caregiverFees.checkoutKey,claim.fee.checkoutKey)));
  if(!session.url)throw new Error("Checkout unavailable.");
  return NextResponse.json({url:session.url});
 }catch(error){
  if(error instanceof PlacementError)return NextResponse.json({error:error.message},{status:error.status});
  return NextResponse.json({error:"Unable to open fee payment. Please try again or contact the agency."},{status:502});
 }
}
