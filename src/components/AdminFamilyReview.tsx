import {db} from "@/db";
import {and,eq} from "drizzle-orm";
import {nannyMatches,nannyApplications} from "@/db/schema";
import {AdminPlacementQuote} from "./AdminPlacementQuote";
import {getCurrentUser} from "@/lib/auth";
import {adminCan} from "@/lib/admin-permissions";
import {getRequestFees} from "@/lib/agency-fees";
import {feeMoney,feePercent} from "@/lib/fee-format";
import {careCategoryLabel} from "@/lib/care-category";
import "./admin-family-review.css";
import Link from "next/link";
import {ArrowLeft,ArrowDownRight,CalendarDays,Check,CheckCircle2,Clock3,CreditCard,FileText,History,Mail,MapPin,Phone,ShieldCheck,Users,Wallet} from "lucide-react";
import type {FamilyRequest} from "@/db/schema";
import {FAMILY_REVIEW_STATUSES} from "@/data/review-statuses";
import {AdminReviewForm} from "./AdminReviewForm";
import {MatchingPanel} from "./MatchingPanel";
import {MembershipPanel} from "./MembershipPanel";

type ReviewEvent={id:string;note:string|null;fromStatus:string;toStatus:string;createdAt:Date;reviewer:string};
const statusLabel=(status:string)=>(FAMILY_REVIEW_STATUSES as Record<string,string>)[status]??status.replaceAll("_"," ");
const date=(value:Date)=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(value);
export async function AdminFamilyReview({request:r,history}:{request:FamilyRequest;history:ReviewEvent[]}){
 const actor=await getCurrentUser(),canPayments=await adminCan(actor,"payments.view"),canQuote=await adminCan(actor,"payments.manage");
 const fees=await getRequestFees(r.id);
 const candidates=canQuote&&r.careCategory==="caregiver"?await db.select({id:nannyMatches.id,name:nannyApplications.name}).from(nannyMatches).innerJoin(nannyApplications,eq(nannyMatches.nannyApplicationId,nannyApplications.id)).where(and(eq(nannyMatches.familyRequestId,r.id),eq(nannyMatches.status,"shortlisted"),eq(nannyApplications.status,"active"))):[];
 const nannyPlacement=r.careCategory==="caregiver",stage=r.status==="placed"?2:["shortlist","placement_fee_due"].includes(r.status)?1:0;
 const statuses=nannyPlacement?FAMILY_REVIEW_STATUSES:Object.fromEntries(Object.entries(FAMILY_REVIEW_STATUSES).filter(([key])=>!["search_fee_invoiced","search_fee_paid","placement_fee_due"].includes(key)));
 const currentStatus=Object.hasOwn(statuses,r.status)?statuses:{...statuses,[r.status]:statusLabel(r.status)};
 return <div className="admin-family-review application-page">
  <Link href="/dashboard/admin?kind=family" className="afr-back"><ArrowLeft size={15} aria-hidden="true"/>Family submissions</Link>
  <header className="afr-heading"><div className="afr-identity"><span className="afr-avatar" aria-hidden="true">{r.name.split(" ").filter(Boolean).slice(0,2).map(part=>part[0]).join("")}</span><div><p className="dashboard-eyebrow">FAMILY REQUEST · {r.id.slice(0,8)}</p><h1>{r.name}</h1><p>{nannyPlacement?"Request a Nanny":"Request a Babysitter"}<span>·</span>Submitted {date(r.createdAt)}</p></div></div><span className={`afr-status ${r.status==="placed"?"is-complete":""}`}><span aria-hidden="true"/>{statusLabel(r.status)}</span></header>
  <div className="mb-5"><Link href={`/dashboard/admin/matching?request=${r.id}`} className="application-submit"><Users size={16} aria-hidden="true"/>Match candidates to this family</Link></div>
  <nav className="afr-section-nav" aria-label="Review sections"><a href="#request-overview">Request overview</a><a href="#candidate-matching">Matching & placement</a><a href="#review-history">Review history <span>{history.length}</span></a></nav>
  <div className="afr-layout"><div className="afr-main">
   <section id="request-overview" className="afr-card"><div className="afr-card-heading"><span><FileText size={19} aria-hidden="true"/></span><div><h2>Request overview</h2><p>The details that guide this family’s search.</p></div><span className="afr-service-tag">{careCategoryLabel(r.careCategory)}</span></div>
    <div className="afr-facts">{[{Icon:CalendarDays,label:"Preferred start",value:r.startDate},{Icon:MapPin,label:"Location",value:[r.town,r.zip].filter(Boolean).join(" ")},{Icon:Wallet,label:"Salary budget",value:r.budget}].map(({Icon,label,value})=><div key={label}><Icon size={17} aria-hidden="true"/><span>{label}</span><strong>{value||"Not specified"}</strong></div>)}</div>
    <dl className="afr-detail-grid"><div><dt>Care arrangement</dt><dd>{r.serviceType}</dd></div><div><dt>Duration & schedule</dt><dd>{r.schedule||"Not specified"}</dd></div></dl>
    <div className="afr-text-block"><h3>Care needs & requirements</h3><p>{r.childrenInfo||"No additional care requirements provided."}</p></div>
    {r.message&&<details className="afr-preferences"><summary>Home & additional preferences<ArrowDownRight size={15} aria-hidden="true"/></summary><p>{r.message}</p></details>}
   </section>
   {canPayments&&<section className="afr-card"><div className="afr-card-heading"><span><CreditCard size={19} aria-hidden="true"/></span><div><h2>{nannyPlacement?"Request a Nanny fees":"Babysitter subscription"}</h2><p>{nannyPlacement?`A ${feeMoney(fees.searchCents)} search fee is due before sourcing; placement is ${feePercent(fees.placementRateBps)} of agreed annual salary before work starts. Nanny wages are separate.`:"This Request a Babysitter is covered by the family’s paid monthly subscription; there are no separate company search or placement fees."}</p></div></div>
    {nannyPlacement?<div className="afr-payments">{[{label:"Search fee",amount:fees.searchCents,status:r.searchFeeStatus,note:"Required before the search starts"},{label:`Placement fee · ${feePercent(fees.placementRateBps)} of annual salary`,amount:fees.placementCents,status:r.placementFeeStatus,note:"Calculated from the agreed annual salary; required before the nanny starts work"}].map(fee=><div key={fee.label}><div><p>{fee.label}</p><strong>{fee.amount===null?"Awaiting salary & placement quote":feeMoney(fee.amount)}<span>USD</span></strong><small>{fee.note}</small></div><span className={`afr-payment-status ${fee.status==="paid"?"is-paid":fee.status==="refunded"?"is-refunded":""}`}>{fee.status==="paid"?<CheckCircle2 size={14} aria-hidden="true"/>:<Clock3 size={14} aria-hidden="true"/>}{fee.status.replaceAll("_"," ")}</span></div>)}</div>:<div className="afr-covered"><ShieldCheck size={21} aria-hidden="true"/><div><strong>Subscription required</strong><p>This Request a Babysitter uses one submission from the family’s paid plan. The plan sets the monthly submission limit.</p></div></div>}
    {nannyPlacement&&fees.annualSalaryCents!==null&&<p className="afr-payment-note">Agreed annual salary {feeMoney(fees.annualSalaryCents)} × {feePercent(fees.placementRateBps)} = {feeMoney(fees.placementCents!)}{fees.candidateName?` · ${fees.candidateName}`:""}</p>}
    {nannyPlacement&&canQuote&&r.searchFeeStatus==="paid"&&!["placed","closed","cancelled"].includes(r.status)&&<AdminPlacementQuote requestId={r.id} rate={fees.placementRateBps} revision={fees.quoteRevision} salary={fees.annualSalaryCents} matchId={fees.matchId} locked={fees.quoteLocked} candidates={candidates}/>}
    {nannyPlacement&&r.status==="placement_fee_due"&&<p className="afr-payment-note">Waiting for the family’s placement payment. Confirm the match only after payment is confirmed.</p>}
    {!nannyPlacement&&r.userId&&<details className="afr-membership"><summary>View membership & payment history</summary><MembershipPanel userId={r.userId} admin/></details>}
   </section>}
   <section className="afr-card afr-progress"><div className="afr-card-heading"><span><Users size={19} aria-hidden="true"/></span><div><h2>Placement progress</h2><p>Follow the search from sourcing to the start of care.</p></div></div><ol>{["Search","Agency selection","Placement"].map((label,i)=><li key={label} className={i<=stage?"is-current":""} aria-current={i===stage?"step":undefined}><span>{i<stage?<Check size={13} aria-hidden="true"/>:String(i+1).padStart(2,"0")}</span><strong>{label}</strong></li>)}</ol></section>
   <div id="candidate-matching" className="afr-matching"><MatchingPanel role="admin" requestId={r.id} requestStatus={r.status} careCategory={nannyPlacement?"caregiver":"nanny"} placementSalaryEntered={fees.annualSalaryCents!==null} placementFeeMatchId={fees.matchId} placementFeePaid={r.placementFeeStatus==="paid"}/></div>
   <section id="review-history" className="afr-card"><div className="afr-card-heading"><span><History size={19} aria-hidden="true"/></span><div><h2>Internal review history</h2><p>Private notes and status changes recorded by your team.</p></div><span className="afr-history-count">{history.length}</span></div>{history.length?<ol className="afr-timeline">{history.map(event=><li key={event.id}><span className="afr-timeline-dot" aria-hidden="true"/><div><header><strong>{event.reviewer}</strong><time dateTime={event.createdAt.toISOString()}>{date(event.createdAt)} · {new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:"Africa/Lagos"}).format(event.createdAt)} WAT</time></header><p className="afr-transition">{statusLabel(event.fromStatus)}<span>→</span>{statusLabel(event.toStatus)}</p>{event.note&&<p className="afr-history-note">{event.note}</p>}</div></li>)}</ol>:<div className="afr-empty"><History size={25} aria-hidden="true"/><h3>No reviews recorded yet</h3><p>Add an internal note or update the request status to start the history.</p></div>}</section>
  </div><aside className="afr-sidebar">
   <section className="afr-card afr-review-controls"><div className="afr-card-heading"><span><FileText size={18} aria-hidden="true"/></span><div><h2>Review & next steps</h2><p>Keep this request moving.</p></div></div><AdminReviewForm key={r.status} kind="family" id={r.id} status={r.status} statuses={currentStatus}/></section>
   <section className="afr-card afr-contact"><p className="afr-overline">FAMILY CONTACT</p><h2>{r.name}</h2><a href={`mailto:${r.email}`}><Mail size={16} aria-hidden="true"/><span>{r.email}</span></a>{r.phone?<a href={`tel:${r.phone}`}><Phone size={16} aria-hidden="true"/><span>{r.phone}</span></a>:<p className="afr-missing-phone">No phone number provided.</p>}<div className="afr-reference"><span>Request reference</span><code>{r.id}</code></div></section>
  </aside></div>
 </div>;
}
