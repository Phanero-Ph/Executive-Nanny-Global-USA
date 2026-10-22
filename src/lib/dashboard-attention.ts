import {and,eq,inArray,notInArray} from "drizzle-orm";
import {db} from "@/db";
import {bookingAssignments,careBookings,caregiverCredentials,familyRequests,nannyApplications,nannyMatches} from "@/db/schema";
import {adminRequestVisibility} from "@/lib/admin-request-visibility";

export type DashboardAttentionCounts=Record<string,number>;

export async function getDashboardAttentionCounts(userId:string,role:string):Promise<DashboardAttentionCounts>{
 if(role==="admin"){
  const [requests,applications,pendingCredentials]=await Promise.all([
   db.select({status:familyRequests.status,careCategory:familyRequests.careCategory,placementFeeStatus:familyRequests.placementFeeStatus}).from(familyRequests).where(adminRequestVisibility()),
   db.select({status:nannyApplications.status}).from(nannyApplications),
   db.select({id:caregiverCredentials.id}).from(caregiverCredentials).where(eq(caregiverCredentials.status,"pending")),
  ]);
  return{
   "Family Requests":requests.filter(r=>["lead","search_fee_paid","searching"].includes(r.status)).length,
   "Nanny Applications":applications.filter(a=>["submitted","document_review","screening","interview","subscription_pending"].includes(a.status)).length,
   "Matching & Placements":requests.filter(r=>["search_fee_paid","searching","shortlist"].includes(r.status)||(r.status==="placement_fee_due"&&r.placementFeeStatus==="paid")).length,
   "Credential Reviews":pendingCredentials.length,
   "Payments & Billing":requests.filter(r=>r.careCategory==="caregiver"&&r.status==="placement_fee_due"&&r.placementFeeStatus!=="paid").length,
  };
 }
 if(role==="family"){
  const [requests,matches]=await Promise.all([
   db.select({careCategory:familyRequests.careCategory,status:familyRequests.status,searchFeeStatus:familyRequests.searchFeeStatus,placementFeeStatus:familyRequests.placementFeeStatus}).from(familyRequests).where(eq(familyRequests.userId,userId)),
   db.select({careCategory:familyRequests.careCategory,status:nannyMatches.status}).from(nannyMatches).innerJoin(familyRequests,eq(nannyMatches.familyRequestId,familyRequests.id)).where(eq(familyRequests.userId,userId)),
  ]);
  const open=requests.filter(r=>!(["closed","cancelled"].includes(r.status)));
  return{
   "Request a Nanny":open.filter(r=>r.careCategory==="caregiver"&&(r.searchFeeStatus!=="paid"||r.placementFeeStatus!=="paid")).length,
   "Babysitter Shortlist":matches.filter(m=>m.careCategory==="nanny"&&m.status==="shortlisted").length,
   "Nanny Shortlist":matches.filter(m=>m.careCategory==="caregiver"&&m.status==="shortlisted").length,
  };
 }
 if(role==="nanny"){
  const [applications,credentials,invites]=await Promise.all([
   db.select({id:nannyApplications.id,status:nannyApplications.status}).from(nannyApplications).where(eq(nannyApplications.userId,userId)),
   db.select({kind:caregiverCredentials.kind,status:caregiverCredentials.status,expiresOn:caregiverCredentials.expiresOn}).from(caregiverCredentials).where(eq(caregiverCredentials.userId,userId)),
   db.select({id:bookingAssignments.id}).from(bookingAssignments).innerJoin(careBookings,eq(bookingAssignments.bookingId,careBookings.id)).where(and(eq(bookingAssignments.caregiverId,userId),eq(bookingAssignments.status,"invited"),notInArray(careBookings.status,["cancelled","completed"]))),
  ]);
  const applicationIds=applications.map(a=>a.id);
  const matches=applicationIds.length?await db.select({status:nannyMatches.status}).from(nannyMatches).where(and(inArray(nannyMatches.nannyApplicationId,applicationIds),eq(nannyMatches.status,"shortlisted"))):[];
  const requiredKinds=["cpr","first_aid"],today=new Date().toISOString().slice(0,10);
  const credentialNeeds=requiredKinds.filter(kind=>{const row=credentials.find(c=>c.kind===kind);return !row||row.status!=="verified"||!!row.expiresOn&&row.expiresOn<today;}).length;
  return{
   "My application":applications.some(a=>a.status==="changes_requested")?1:0,
   "Care assignments":invites.length,
   "Family matches":matches.length,
   "My credentials":credentialNeeds,
  };
 }
 return {};
}
