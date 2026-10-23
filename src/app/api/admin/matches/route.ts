import {adminCan} from "@/lib/admin-permissions";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {adminRequestVisibility} from "@/lib/admin-request-visibility";
import {caregiverSearchAllowed,caregiverPlacementAllowed,nannySubmissionAllowance} from "@/lib/placement-policy";
import {screeningEligible} from "@/lib/screening";
import {credentialsEligible} from "@/lib/credentials";
import { NextResponse } from "next/server";
import { and,eq,inArray,ne,or,sql } from "drizzle-orm";
import { db } from "@/db";
import { familyRequests,nannyApplications,nannyMatches,users,reviewEvents,careBookings,caregiverFees } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isDuplicateEntry } from "@/db/errors";
import { queueEmail,appUrl } from "@/lib/mail";
const TRANSITIONS:Record<string,string[]>={shortlisted:["shortlisted","placed","closed"],interview:["shortlisted","placed","closed"],placed:["placed","closed"],closed:["shortlisted"]};
async function handle(req:Request,create:boolean) {
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(actor,"matching.manage"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 try {
  const body=await req.json();
  if(typeof body.sharedNote!=="string"||body.sharedNote.length>5000)return NextResponse.json({error:"Shared notes must be under 5,000 characters."},{status:400});
  if(create&&(typeof body.requestId!=="string"||typeof body.applicationId!=="string"))return NextResponse.json({error:"Choose a request and nanny."},{status:400});
  if(!create&&(typeof body.id!=="string"||!Number.isInteger(body.revision)||typeof body.status!=="string"))return NextResponse.json({error:"Invalid match update."},{status:400});
  const desired=create?"shortlisted":body.status;
  if(!["shortlisted","placed","closed"].includes(desired))return NextResponse.json({error:"Invalid match status."},{status:400});
  if(desired==="placed"&&(typeof body.placementStart!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(body.placementStart)||Number.isNaN(Date.parse(body.placementStart))||new Date(`${body.placementStart}T00:00:00Z`).toISOString().slice(0,10)!==body.placementStart))return NextResponse.json({error:"A placement start date is required."},{status:400});
  const [existing]=create?[]:await db.select().from(nannyMatches).where(eq(nannyMatches.id,body.id)).limit(1);
  if(!create&&!existing)return NextResponse.json({error:"Match not found."},{status:404});
  const requestId=create?body.requestId:existing.familyRequestId,applicationId=create?body.applicationId:existing.nannyApplicationId;
  const outcome=await db.transaction(async tx=>{
   const [family]=await tx.select().from(familyRequests).where(and(eq(familyRequests.id,requestId),adminRequestVisibility())).for("update");
   const [nanny]=await tx.select().from(nannyApplications).where(eq(nannyApplications.id,applicationId)).for("update");
   if(!family||!family.userId||!nanny||!nanny.userId)return{error:"Submission not found.",status:404};
   const [familyAccount]=await tx.select({role:users.role}).from(users).where(eq(users.id,family.userId)).for("update");
   if(familyAccount?.role!=="family")return{error:"This request must be linked to a family account.",status:409};
   const [nannyAccount]=await tx.select({id:users.id,role:users.role}).from(users).where(eq(users.id,nanny.userId)).for("update");
   if(nannyAccount?.role!=="nanny")return{error:"This application is not linked to a nanny account.",status:409};
   if(create){const [alreadyLinked]=await tx.select({id:nannyMatches.id,status:nannyMatches.status}).from(nannyMatches).where(and(eq(nannyMatches.familyRequestId,requestId),eq(nannyMatches.nannyApplicationId,applicationId))).for("update");if(alreadyLinked)return{error:"This nanny is already matched to this family request. Update the existing match shown above; a duplicate match cannot be created.",status:409};}
   let [match]=create?[]:await tx.select().from(nannyMatches).where(eq(nannyMatches.id,body.id)).for("update");
   if(!create&&(!match||match.revision!==body.revision))return{error:"This match changed. Refresh before saving.",status:409};
   // Reconcile legacy records where the request and nanny were marked placed but
   // the shared match row remained shortlisted.
   const previousStatus=match?.status==="shortlisted"&&family.status==="placed"&&nanny.status==="placed"?"placed":match?.status;
   if(match&&previousStatus&&!TRANSITIONS[previousStatus]?.includes(desired))return{error:"That match transition is not allowed.",status:409};
   const [placementFee]=family.careCategory==="caregiver"?await tx.select().from(caregiverFees).where(and(eq(caregiverFees.requestId,requestId),eq(caregiverFees.kind,"placement"))):[];
   if(placementFee?.matchId&&desired==="placed"&&placementFee.matchId!==match?.id)return{error:"The paid placement fee belongs to a different nanny. Place the nanny named on the invoice.",status:409};
   if(desired==="placed"&&family.careCategory==="caregiver"&&(!placementFee||placementFee.annualSalaryCents===null||placementFee.amountCents<=0||placementFee.matchId!==match?.id))return{error:"Before confirming placement, enter the family-agreed annual salary for this nanny and publish the calculated 15% placement fee so the family can pay it.",status:409};
   if(desired==="closed"&&previousStatus!=="placed"&&placementFee?.matchId===match?.id&&(placementFee?.checkoutSessionId||placementFee?.paidAt||placementFee?.status==="checkout_pending"))return{error:"Resolve this nanny’s issued placement invoice before closing the match.",status:409};
   if(desired!=="closed"){
    if(!caregiverSearchAllowed(family))return{error:"The nanny search fee must be confirmed before searching or shortlisting.",status:409};
    if(family.careCategory==="nanny"&&!await nannySubmissionAllowance(tx,family.userId))return{error:"The family needs an active, fully paid babysitter subscription to continue the search or placement.",status:409};
    if(desired==="placed"&&!caregiverPlacementAllowed(family))return{error:family.careCategory==="caregiver"&&placementFee?.annualSalaryCents===null?"Enter the family-agreed annual salary and publish the calculated placement fee before placement. The family must pay it before work starts.":"The family must pay the nanny placement fee before work can start.",status:409};
   }
   if(desired!=="closed"&&nanny.status!=="active"&&!(previousStatus==="placed"&&nanny.status==="placed"))return{error:"Only approved, active nanny applications can be shortlisted.",status:409};
   if(desired!=="closed"&&!await screeningEligible(tx,nanny))return{error:"Complete agency screening, verify every reference and approve current credentials before matching.",status:409};
   const occupied=await tx.select({id:nannyMatches.id,requestId:nannyMatches.familyRequestId}).from(nannyMatches).innerJoin(nannyApplications,eq(nannyMatches.nannyApplicationId,nannyApplications.id)).where(and(eq(nannyMatches.status,"placed"),or(eq(nannyMatches.familyRequestId,requestId),eq(nannyApplications.userId,nanny.userId)),match?ne(nannyMatches.id,match.id):undefined)).limit(1);
   if(desired!=="closed"&&(family.status==="placed"&&previousStatus!=="placed"||occupied.length))return{error:"The family request or nanny already has an active placement.",status:409};
   if(desired==="placed"){
    if(!await credentialsEligible(tx,nanny.userId,new Date(Math.max(Date.now(),Date.parse(body.placementStart+"T00:00:00Z")))))return{error:"Current CPR and First Aid certificates and a clear, current agency background check are required for the placement start date.",status:409};
    const bookings=await tx.select({id:careBookings.id}).from(careBookings).where(and(eq(careBookings.caregiverId,nanny.userId),or(eq(careBookings.status,"assigned"),eq(careBookings.status,"accepted"),eq(careBookings.status,"confirmed")),sql`${careBookings.endsAt}>${new Date()}`)).limit(1).for("update");
    if(bookings.length)return{error:"This caregiver has upcoming care bookings. Resolve them before confirming a placement.",status:409};
   }
   const before=family.status;
   const values={status:desired,placementStart:desired==="placed"?body.placementStart:match?.status==="closed"&&desired==="shortlisted"?null:match?.placementStart??null,sharedNote:body.sharedNote.trim()||null,updatedAt:new Date()};
   let id=match?.id;
   if(create){const [result]=await tx.insert(nannyMatches).values({...values,familyRequestId:requestId,nannyApplicationId:applicationId,createdBy:actor.id}).$returningId();id=result.id;}
   else await tx.update(nannyMatches).set({...values,revision:sql`${nannyMatches.revision} + 1`}).where(eq(nannyMatches.id,match!.id));
   if(desired==="placed") {
    await tx.update(nannyMatches).set({status:"closed",revision:sql`${nannyMatches.revision} + 1`,updatedAt:new Date()}).where(and(eq(nannyMatches.familyRequestId,requestId),ne(nannyMatches.id,id!),or(eq(nannyMatches.status,"shortlisted"),eq(nannyMatches.status,"interview"))));
    // A nanny can only hold one active placement. Close any other open shortlist
    // records so other families and the nanny see the same outcome.
    const otherShortlists=await tx.select({id:nannyMatches.id,requestId:nannyMatches.familyRequestId}).from(nannyMatches).innerJoin(nannyApplications,eq(nannyMatches.nannyApplicationId,nannyApplications.id)).where(and(ne(nannyMatches.id,id!),eq(nannyMatches.status,"shortlisted"),eq(nannyApplications.userId,nanny.userId)));
    if(otherShortlists.length)await tx.update(nannyMatches).set({status:"closed",revision:sql`${nannyMatches.revision} + 1`,updatedAt:new Date()}).where(inArray(nannyMatches.id,otherShortlists.map(row=>row.id)));
   }
   const current=await tx.select({status:nannyMatches.status}).from(nannyMatches).where(eq(nannyMatches.familyRequestId,requestId));
   let familyStatus=current.some(row=>row.status==="placed")?"placed":current.some(row=>row.status==="shortlisted")?"shortlist":"searching";
   if(family.careCategory==="caregiver"&&!caregiverSearchAllowed(family)&&familyStatus==="searching")familyStatus="search_fee_invoiced";
   if(family.careCategory==="caregiver"&&family.status==="placement_fee_due"&&familyStatus==="shortlist")familyStatus="placement_fee_due";
   await tx.update(familyRequests).set({status:familyStatus}).where(eq(familyRequests.id,requestId));
   if(desired==="placed"||previousStatus==="placed"){
    const nannyStatus=desired==="placed"?"placed":"active";
    await tx.update(nannyApplications).set({status:nannyStatus}).where(eq(nannyApplications.id,applicationId));
    await tx.insert(reviewEvents).values({reviewerId:actor.id,nannyApplicationId:applicationId,fromStatus:nanny.status,toStatus:nannyStatus,note:`Placement match ${id}: ${desired}`});
   }
   await tx.insert(reviewEvents).values({reviewerId:actor.id,familyRequestId:requestId,fromStatus:before,toStatus:familyStatus,note:`Match ${id}: ${match?.status||"new"} -> ${desired}`});
   return{status:200,id,family,nanny};
  });
  if(outcome.status!==200)return NextResponse.json({error:outcome.error},{status:outcome.status});
  const statusLabel=desired==="placed"?"Placed":desired==="shortlisted"?"Shortlisted":"Match closed";
  try {await Promise.all([queueEmail(outcome.family!.userId,outcome.family!.email,desired==="placed"?"Your nanny has been placed":"An update on your nanny match",`Your match status is now ${statusLabel}. See your dashboard for details: ${appUrl("/dashboard/family")}\n\nExecutive Global Nanny`),queueEmail(outcome.nanny!.userId,outcome.nanny!.email,desired==="placed"?"You have been placed with a family":"An update on your matching opportunity",`Your match status is now ${statusLabel}. See your dashboard for details: ${appUrl("/dashboard/nanny")}\n\nExecutive Global Nanny`)]);}catch{console.error("Matching notification could not be queued.");}
  return NextResponse.json({ok:true,id:outcome.id});
}catch(error){return NextResponse.json({error:isDuplicateEntry(error)?"This nanny is already matched to this family request. Update the existing match shown above; a duplicate match cannot be created.":"Could not save this match."},{status:isDuplicateEntry(error)?409:500});}
}
export async function POST(req:Request){return handle(req,true);}
export async function PATCH(req:Request){return handle(req,false);}
