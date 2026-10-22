import {adminCan} from "@/lib/admin-permissions";
import {screeningEligible} from "@/lib/screening";
import {applicationScreenings} from "@/db/schema";
import {applicationDigest} from "@/lib/screening-policy";
import {parseApplication} from "@/lib/application-data";
import {adminRequestVisibility} from "@/lib/admin-request-visibility";
import {caregiverSearchAllowed,caregiverPlacementAllowed,nannySubmissionAllowance} from "@/lib/placement-policy";
import { queueEmail, appUrl } from "@/lib/mail";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { familyRequests, nannyApplications, reviewEvents, nannyMatches, users, caregiverFees } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { FAMILY_REVIEW_STATUSES, NANNY_REVIEW_STATUSES } from "@/data/review-statuses";
import {NANNY_ADMIN_DECISION_STATUSES} from "@/data/review-statuses";
export async function PATCH(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
 if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
 if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
 const { kind, id } = await params;
 if(!await adminCan(user,kind==="family"?"families.review":"nannies.approve"))return NextResponse.json({error:"Permission required."},{status:403});
 if (!["family","nanny"].includes(kind)) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
 try {
  const body = await req.json();
  const statuses = kind === "family" ? FAMILY_REVIEW_STATUSES : NANNY_REVIEW_STATUSES;
  if (typeof body.status !== "string" || !(kind==="nanny"?Object.hasOwn(NANNY_ADMIN_DECISION_STATUSES,body.status)||body.status===body.expectedStatus:Object.hasOwn(statuses,body.status)) || typeof body.note !== "string" || body.note.length > 10000 || typeof body.expectedStatus !== "string") return NextResponse.json({ error: "Choose a valid status and keep notes under 10,000 characters." }, { status: 400 });
  const decision=kind==="nanny"&&["changes_requested","rejected"].includes(body.status);
  if(decision&&(typeof body.feedback!=="string"||!body.feedback.trim()||body.feedback.length>5000))return NextResponse.json({error:"Add applicant-facing feedback (up to 5,000 characters)."},{status:400});
  const outcome = await db.transaction(async tx => {
   const table = kind === "family" ? familyRequests : nannyApplications;
   const [record] = await tx.select({ id: table.id, status: table.status, email:table.email, userId:table.userId }).from(table).where(and(eq(table.id,id),kind==="family"?adminRequestVisibility():undefined)).for("update");
   if (!record) return 404;
   if (record.status !== body.expectedStatus) return 409;
   let nannyApplication:typeof nannyApplications.$inferSelect|undefined;
   if(kind==="nanny"){
    [nannyApplication]=await tx.select().from(nannyApplications).where(eq(nannyApplications.id,id));
    if(!nannyApplication)return 404;
    if(body.status==="active"&&!await screeningEligible(tx,nannyApplication))return 412;
   }
   if(kind==="family"){
    const [request]=await tx.select().from(familyRequests).where(eq(familyRequests.id,id));
    const progressing=["search_fee_paid","searching","shortlist","placement_fee_due","placed"].includes(body.status);
    if(progressing&&!caregiverSearchAllowed(request))return 402;
    if(progressing&&request.careCategory==="nanny"){
     if(!request.userId)return 402;
     await tx.select({id:users.id}).from(users).where(eq(users.id,request.userId)).for("update");
     if(!await nannySubmissionAllowance(tx,request.userId))return 402;
    }
    if(body.status==="placed"&&!caregiverPlacementAllowed(request))return 402;
    if(body.status==="placement_fee_due"){
     const [candidate]=await tx.select({id:nannyMatches.id}).from(nannyMatches).where(and(eq(nannyMatches.familyRequestId,id),eq(nannyMatches.status,"shortlisted"))).limit(1);
     const [quote]=await tx.select().from(caregiverFees).where(and(eq(caregiverFees.requestId,id),eq(caregiverFees.kind,"placement")));
     if(request.careCategory!=="caregiver"||!candidate||!quote)return 423;
    }
   }
   const [placement]=await tx.select({id:nannyMatches.id,familyRequestId:nannyMatches.familyRequestId}).from(nannyMatches).where(and(eq(kind === "family" ? nannyMatches.familyRequestId : nannyMatches.nannyApplicationId,id),eq(nannyMatches.status,"placed"))).limit(1);
   if ((body.status === "placed" && !placement) || (placement && body.status !== "placed")) return 422;
   if(body.status==="placed"&&placement){const [placementRequest]=await tx.select().from(familyRequests).where(eq(familyRequests.id,placement.familyRequestId));if(placementRequest?.careCategory==="caregiver"){const [quote]=await tx.select().from(caregiverFees).where(and(eq(caregiverFees.requestId,placementRequest.id),eq(caregiverFees.kind,"placement")));if(!quote||quote.annualSalaryCents===null||quote.amountCents<=0||quote.matchId!==placement.id)return 423;if(quote.status!=="paid"||placementRequest.placementFeeStatus!=="paid")return 402;}}
   if (body.status === record.status && !body.note.trim()) return 400;
    if(decision){
     const [screening]=await tx.select().from(applicationScreenings).where(eq(applicationScreenings.applicationId,id));
     if(screening)await tx.update(applicationScreenings).set({feedback:body.feedback.trim(),revision:screening.revision+1,reviewedBy:user.id,updatedAt:new Date()}).where(eq(applicationScreenings.applicationId,id));
     else {
      const data=parseApplication(nannyApplication!.bio);
      await tx.insert(applicationScreenings).values({applicationId:id,applicationDigest:applicationDigest(nannyApplication!.bio),checks:"{}",referenceReviews:JSON.stringify((data?.references??[]).map(()=>({status:"pending",note:""}))),feedback:body.feedback.trim(),revision:0,reviewedBy:user.id,updatedAt:new Date()});
     }
    }
   await tx.update(table).set({ status: body.status }).where(eq(table.id,id));
   await tx.insert(reviewEvents).values({ reviewerId:user.id, familyRequestId:kind === "family" ? id : null, nannyApplicationId:kind === "nanny" ? id : null, note:body.note.trim() || null, fromStatus:record.status, toStatus:body.status });
   return { record, changed: body.status !== record.status };
  });
  if (typeof outcome === "number") return NextResponse.json({ error: outcome === 412 ? "Complete the screening checklist, verify all references, record a current clear agency background check, and approve current CPR and First Aid certificates before approval." : outcome === 402 ? "A verified fee payment or active paid babysitter subscription is required before progressing this request. The family must pay the placement fee before the nanny starts work." : outcome === 423 ? "Before placement, enter the family-agreed annual salary, publish the calculated 15% fee for the selected nanny, and have the family pay it." : outcome === 404 ? "Submission not found." : outcome === 409 ? "This submission changed since you opened it. Refresh before saving." : outcome === 422 ? "Manage placement changes through the matching panel on the family request." : "Add a note or change the status before saving." }, { status: outcome });
  if (outcome.changed) {
   try { await queueEmail(outcome.record.userId, outcome.record.email, "An update on your submission", `Your submission status is now: ${(statuses as Record<string,string>)[body.status]}.${decision?`\n\nAgency feedback: ${body.feedback.trim()}`:""}\n\nView your dashboard: ${appUrl(`/dashboard/${kind}`)}\n\nExecutive Global Nanny`); } catch { console.error("Status notification could not be queued."); }
  }
  return NextResponse.json({ ok:true });
 } catch { return NextResponse.json({ error:"Could not save this review. Please try again." }, { status:500 }); }
}
