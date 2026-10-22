import {requireAdmin} from "@/lib/admin-access";
import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {and,count,desc,eq,like,or} from "drizzle-orm";
import {ArrowRight,ArrowUpRight,Check,CheckCircle2,Clock3,FileSearch,Search,ShieldCheck,Users} from "lucide-react";
import {db} from "@/db";
import {familyRequests,nannyApplications,nannyMatches} from "@/db/schema";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {adminRequestVisibility} from "@/lib/admin-request-visibility";
import {FAMILY_REVIEW_STATUSES} from "@/data/review-statuses";
import {MatchingPanel} from "@/components/MatchingPanel";
import {DashboardHeading} from "@/components/DashboardElements";
import {getRequestFees} from "@/lib/agency-fees";
import {feeMoney,feePercent} from "@/lib/fee-format";
import {careCategoryLabel} from "@/lib/care-category";
import {adminCan} from "@/lib/admin-permissions";
import {AdminPlacementQuote} from "@/components/AdminPlacementQuote";
import {AdminPlacementConfirmation} from "@/components/AdminPlacementConfirmation";

export const dynamic="force-dynamic";
export const metadata={title:"Matching & placements",robots:{index:false,follow:false}};

const reviewStatus=(status:string)=>(FAMILY_REVIEW_STATUSES as Record<string,string>)[status]??status.replaceAll("_"," ");

export default async function MatchingPage({searchParams}:{searchParams:Promise<{request?:string;q?:string}>}){
 const user=await getCurrentUser();
 if(!user)redirect("/login");
 if(user.role!=="admin")redirect(`/dashboard/${user.role}`);
 await requireAdmin("matching.view");

 const params=await searchParams;
 const q=(params.q??"").trim().slice(0,120);
 const canManageMatching=await adminCan(user,"matching.manage");
 const requests=await db.select().from(familyRequests)
  .where(and(adminRequestVisibility(),q?or(like(familyRequests.name,`%${q}%`),like(familyRequests.serviceType,`%${q}%`)):undefined))
  .orderBy(desc(familyRequests.createdAt)).limit(100);
 const [selected]=params.request
  ?await db.select().from(familyRequests).where(and(eq(familyRequests.id,params.request),adminRequestVisibility())).limit(1)
  :[requests.find(request=>!["placed","closed","cancelled"].includes(request.status))??requests[0]];
 if(params.request&&!selected)notFound();

 const isNannyPlacement=selected?.careCategory==="caregiver";
 const selectedFees=isNannyPlacement?await getRequestFees(selected.id):null;
 const canQuote=isNannyPlacement&&await adminCan(user,"payments.manage");
 const shortlistedMatches=selected?await db.select({
  id:nannyMatches.id,
  name:nannyApplications.name,
  applicationId:nannyApplications.id,
  revision:nannyMatches.revision,
  placementStart:nannyMatches.placementStart,
  sharedNote:nannyMatches.sharedNote,
 }).from(nannyMatches)
  .innerJoin(nannyApplications,eq(nannyMatches.nannyApplicationId,nannyApplications.id))
  .where(and(eq(nannyMatches.familyRequestId,selected.id),eq(nannyMatches.status,"shortlisted"),eq(nannyApplications.status,"active")))
  :[];
 const [{active}]=await db.select({active:count()}).from(nannyApplications).where(eq(nannyApplications.status,"active"));
 const salaryEntered=selectedFees?.annualSalaryCents!==null&&selectedFees?.annualSalaryCents!==undefined;
 const quoteMatchesNanny=!!selectedFees?.matchId&&shortlistedMatches.some(match=>match.id===selectedFees.matchId);
 const quoteReady=!!salaryEntered&&quoteMatchesNanny;
 const placed=selected?.status==="placed";
 const feePaid=selected?.placementFeeStatus==="paid";
 const stepNow=!selected?1:placed?4:shortlistedMatches.length===0?2:isNannyPlacement&&(!quoteReady||!feePaid)?3:4;
 const activeRequests=requests.filter(request=>!["placed","closed","cancelled"].includes(request.status));
 const shortlistQueue=requests.filter(request=>["search_fee_paid","searching"].includes(request.status));
 const paymentQueue=requests.filter(request=>request.careCategory==="caregiver"&&request.status==="placement_fee_due"&&request.placementFeeStatus!=="paid");
 const placementQueue=requests.filter(request=>["shortlist","placement_fee_due"].includes(request.status)&&(request.careCategory!=="caregiver"||request.placementFeeStatus==="paid"));
 const nextAction=placed
  ?{eyebrow:"COMPLETE",title:"Placement confirmed",description:"This family and nanny are now marked placed across the agency and member dashboards.",href:`/dashboard/admin/family/${selected!.id}`,label:"View placement record",tone:"teal" as const}
  :shortlistedMatches.length===0
   ?{eyebrow:"AGENCY ACTION",title:active===0?"Approve an eligible nanny first":"Build the family shortlist",description:active===0?"No approved nannies are available. Review applications and mark a nanny eligible for matching.":"Review approved profiles and add a suitable nanny to this family’s shortlist.",href:active===0?"/dashboard/admin?kind=nanny":"#candidate-shortlist",label:active===0?"Review applications":"Go to shortlist",tone:"orange" as const}
   :isNannyPlacement&&!quoteReady
    ?{eyebrow:"AGENCY ACTION",title:"Record the agreed annual salary",description:"Select the shortlisted nanny, enter the salary agreed with the family, and publish the calculated placement fee.",href:canQuote?"#salary-and-fee":`/dashboard/admin/family/${selected!.id}`,label:canQuote?"Enter salary & calculate fee":"Open fee details",tone:"orange" as const}
    :isNannyPlacement&&!feePaid
     ?{eyebrow:"WAITING FOR FAMILY",title:"Placement fee payment is pending",description:"The salary quote is published. The family must pay the placement fee before you can confirm the start date.",href:`/dashboard/admin/family/${selected!.id}`,label:"View payment status",tone:"blue" as const}
     :{eyebrow:"AGENCY ACTION",title:"Confirm the agreed start date",description:"All prerequisites are complete. Choose the shortlisted nanny and confirm the placement date.",href:"#confirm-placement",label:"Confirm placement",tone:"teal" as const};
 const steps=[
  {title:"Choose request",description:"Select a family"},
  {title:"Build shortlist",description:"Select an eligible nanny"},
  {title:isNannyPlacement?"Salary & fee":"Review readiness",description:isNannyPlacement?"Publish and collect payment":"Subscription-based"},
  {title:"Confirm placement",description:"Set the agreed start date"},
 ];

 return <section className="application-page space-y-6">
  <DashboardHeading eyebrow="Agency placement workflow" title="Matching & placements" description="Work through each stage in order, from selecting a family request to confirming the nanny’s start date.">
   <Link href="/dashboard/admin?kind=nanny" className="application-secondary">Review nanny applications<ArrowUpRight size={15} aria-hidden="true"/></Link>
  </DashboardHeading>

  <section aria-label="Work queue summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   {[{label:"Open requests",value:activeRequests.length,detail:"Still in progress",icon:<FileSearch size={18}/>,tone:"teal"},{label:"Need a shortlist",value:shortlistQueue.length,detail:"Sourcing stage",icon:<Users size={18}/>,tone:"blue"},{label:"Awaiting payment",value:paymentQueue.length,detail:"Family action required",icon:<Clock3 size={18}/>,tone:"orange"},{label:"Ready to place",value:placementQueue.length,detail:`${active} eligible nannies`,icon:<ShieldCheck size={18}/>,tone:"green"}].map(card=><div key={card.label} className="rounded-2xl border border-cream-300 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-500">{card.label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${card.tone==="orange"?"bg-orange-50 text-orange-700":card.tone==="blue"?"bg-sky-50 text-sky-700":card.tone==="green"?"bg-emerald-50 text-emerald-700":"bg-teal-pale text-teal-brand"}`}>{card.icon}</span></div><p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">{card.value}</p><p className="mt-1 text-[11px] text-slate-500">{card.detail}</p></div>)}
  </section>

  <section aria-label="Placement progress" className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
   <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-teal-brand">Follow the steps in order</p><h2 className="mt-1 text-lg font-semibold text-ink-900">Placement progress</h2></div><span className="rounded-full bg-cream-50 px-3 py-1.5 text-xs font-semibold text-slate-600">{placed?"Workflow complete":`Step ${stepNow} of 4`}</span></div>
   <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{steps.map((step,index)=>{const number=index+1,complete=placed||number<stepNow,activeStep=!placed&&number===stepNow;return <li key={step.title} aria-current={activeStep?"step":undefined} className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 ${complete?"border-teal-border bg-teal-pale":activeStep?"border-orange-300 bg-orange-50":"border-cream-300 bg-white"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${complete?"bg-teal-brand text-white":activeStep?"bg-orange-500 text-white":"bg-cream-100 text-slate-500"}`}>{complete?<Check size={15}/>:String(number).padStart(2,"0")}</span><div className="min-w-0"><p className={`text-sm font-semibold ${complete?"text-teal-brand":activeStep?"text-orange-900":"text-slate-500"}`}>{step.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p></div></li>;})}</ol>
  </section>

  <section id="family-request" className="scroll-mt-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-pale text-teal-brand"><span className="text-sm font-bold">01</span></span><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal-brand">Start here</p><h2 className="mt-1 text-lg font-semibold text-ink-900">Choose a family request</h2><p className="mt-1 text-sm text-slate-500">Select the family whose care requirements you are working on.</p></div></div><form className="flex w-full gap-2 sm:w-auto"><label className="min-w-0 flex-1 sm:w-64"><span className="sr-only">Search family requests</span><input name="q" defaultValue={q} maxLength={120} placeholder="Search by family or care type" className="application-input"/></label><button className="application-secondary !px-3" aria-label="Search requests"><Search size={16}/></button></form></div>
   <nav aria-label="Family requests for matching" className="mt-5 grid max-h-[340px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">{requests.map(request=><Link key={request.id} href={`/dashboard/admin/matching?request=${request.id}${q?`&q=${encodeURIComponent(q)}`:""}`} aria-current={selected?.id===request.id?"page":undefined} className={`group rounded-xl border p-4 transition-colors ${selected?.id===request.id?"border-teal-brand bg-teal-pale shadow-sm":"border-cream-300 bg-white hover:border-teal-border hover:bg-cream-50"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-teal-brand">{careCategoryLabel(request.careCategory)}</span><strong className="mt-1 block truncate text-sm font-semibold text-ink-900">{request.name}</strong><span className="mt-1 block truncate text-xs text-slate-500">{request.serviceType}</span></div><ArrowRight size={16} className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-brand" aria-hidden="true"/></div><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${request.status==="placed"?"bg-cream-100 text-slate-600":"bg-white text-teal-brand"}`}>{reviewStatus(request.status)}</span></Link>)}{!requests.length&&<p className="rounded-xl bg-cream-50 p-4 text-sm leading-6 text-slate-600 sm:col-span-2 xl:col-span-3">{q?"No matching requests. Try another name or service type.":"No family requests are available yet. Requests appear here once they meet the search-payment requirement."}</p>}</nav>
  </section>

  {!selected?<div className="rounded-2xl border border-dashed border-cream-300 bg-white px-6 py-14 text-center"><FileSearch size={32} className="mx-auto text-teal-brand" aria-hidden="true"/><h2 className="mt-4 text-xl font-semibold text-ink-900">Select a request to begin</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">The family’s request details and next steps will appear below the selector.</p></div>:<>
   <section aria-labelledby="selected-request-title" className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-pale text-sm font-bold text-teal-brand">01</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal-brand">Selected {careCategoryLabel(selected.careCategory)}</p><h2 id="selected-request-title" className="mt-1 break-words text-xl font-semibold text-ink-900">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.serviceType} · {reviewStatus(selected.status)}</p></div></div><Link href={`/dashboard/admin/family/${selected.id}`} className="application-secondary">Full request & payments<ArrowUpRight size={14} aria-hidden="true"/></Link></div>
    <dl className="mt-5 grid gap-3 sm:grid-cols-3">{[{label:"Care arrangement",value:selected.serviceType},{label:"Preferred start",value:selected.startDate},{label:"Location",value:[selected.town,selected.zip].filter(Boolean).join(" ")}].map(item=><div key={item.label} className="rounded-xl bg-cream-50 p-4"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</dt><dd className="mt-2 break-words text-sm font-medium leading-6 text-ink-900">{item.value||"Not specified"}</dd></div>)}</dl>
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-cream-300 bg-white p-4"><span className="mt-0.5 text-teal-brand"><ShieldCheck size={18}/></span><p className="text-sm leading-6 text-slate-600">{isNannyPlacement&&selectedFees?`Search fee: ${feeMoney(selectedFees.searchCents)} · ${reviewStatus(selected.searchFeeStatus)}. Placement fee: ${feePercent(selectedFees.placementRateBps)} of agreed annual salary, payable before the nanny starts. Wages are paid separately.`:"This Request a Babysitter uses the family’s paid subscription and monthly submission allowance; there is no separate company placement fee."}</p></div>
    <details className="mt-4 rounded-xl border border-cream-300 px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-teal-brand">Review family care requirements</summary><div className="mt-3 grid gap-4 border-t border-cream-300 pt-3 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Children & care needs</p><p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{selected.childrenInfo||"Not specified"}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Schedule</p><p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{selected.schedule||"Not specified"}</p></div>{selected.message&&<div className="sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Additional preferences</p><p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{selected.message}</p></div>}</div></details>
   </section>

   <section aria-label="Recommended next action" className={`overflow-hidden rounded-2xl border shadow-sm ${nextAction.tone==="orange"?"border-orange-200 bg-orange-50":nextAction.tone==="blue"?"border-sky-200 bg-sky-50":"border-teal-border bg-teal-pale"}`}><div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6"><div className="flex min-w-0 items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white ${nextAction.tone==="orange"?"text-orange-700":nextAction.tone==="blue"?"text-sky-700":"text-teal-brand"}`}>{placed?<CheckCircle2 size={19}/>:<ArrowRight size={19}/>}</span><div className="min-w-0"><p className={`text-[10px] font-bold uppercase tracking-[.15em] ${nextAction.tone==="orange"?"text-orange-800":nextAction.tone==="blue"?"text-sky-800":"text-teal-brand"}`}>{nextAction.eyebrow} · NEXT ACTION</p><h2 className="mt-1 text-base font-semibold text-ink-900">{nextAction.title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{nextAction.description}</p></div></div><Link href={nextAction.href} className="application-secondary shrink-0">{nextAction.label}<ArrowRight size={15} aria-hidden="true"/></Link></div></section>

   <section id="candidate-shortlist" className="scroll-mt-6">
    <div className="mb-3 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-pale text-sm font-bold text-teal-brand">02</span><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal-brand">Next · nanny selection</p><h2 className="mt-1 text-lg font-semibold text-ink-900">Review and build the shortlist</h2><p className="mt-1 text-sm text-slate-500">Add approved nannies, review their match details, and keep notes for the family and nanny.</p></div></div>
    <MatchingPanel role="admin" requestId={selected.id} requestStatus={selected.status} careCategory={isNannyPlacement?"caregiver":"nanny"} placementSalaryEntered={salaryEntered} placementFeeMatchId={selectedFees?.matchId??null} placementFeePaid={feePaid} allowPlacement={false}/>
   </section>

   <section id="salary-and-fee" className="scroll-mt-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${isNannyPlacement?"bg-orange-100 text-orange-800":"bg-teal-pale text-teal-brand"}`}>03</span><div><p className={`text-[10px] font-bold uppercase tracking-[.15em] ${isNannyPlacement?"text-orange-700":"text-teal-brand"}`}>{isNannyPlacement?"Required before placement":"Subscription placement"}</p><h2 className="mt-1 text-lg font-semibold text-ink-900">{isNannyPlacement?"Record salary and collect the placement fee":"Confirm subscription and placement readiness"}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{isNannyPlacement?"After selecting a nanny, enter the annual salary agreed with the family. The system calculates the placement fee at the request’s saved rate and makes it available for payment.":"This babysitter request is covered by the family’s subscription. There is no separate salary-based placement fee."}</p></div></div>
    {isNannyPlacement?<>{canQuote&&selectedFees&&selected.searchFeeStatus==="paid"&&!(["placed","closed","cancelled"].includes(selected.status))?<AdminPlacementQuote requestId={selected.id} rate={selectedFees.placementRateBps} revision={selectedFees.quoteRevision} salary={selectedFees.annualSalaryCents} matchId={selectedFees.matchId} locked={selectedFees.quoteLocked} candidates={shortlistedMatches.map(match=>({id:match.id,name:match.name}))}/>:<div className="rounded-xl border border-cream-300 bg-cream-50 p-5"><p className="font-semibold text-ink-900">{selected.searchFeeStatus!=="paid"?`Waiting for the ${selectedFees?feeMoney(selectedFees.searchCents):"search fee"} to be confirmed.`:!canQuote?"Payment management permission is required to publish a placement fee.":selected.status==="placed"?"The placement has already been completed.":"A salary-based quote cannot be created for this request."}</p><p className="mt-2 text-sm leading-6 text-slate-600">Once the requirement is met, the salary form will be available here and on the family request review page.</p></div>}{selectedFees?.annualSalaryCents!==null&&selectedFees?.annualSalaryCents!==undefined&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-border bg-teal-pale p-4"><div><p className="text-xs font-semibold text-ink-900">{quoteReady?"Salary quote published":"Salary quote needs a nanny match"}</p><p className="mt-1 text-sm text-slate-600">{feeMoney(selectedFees.annualSalaryCents)} × {feePercent(selectedFees.placementRateBps)} = {feeMoney(selectedFees.placementCents??0)}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${feePaid?"bg-white text-teal-brand":"bg-orange-100 text-orange-900"}`}>{feePaid?"Family payment confirmed":"Awaiting family payment"}</span></div>}</>:<div className="flex items-start gap-3 rounded-xl border border-teal-border bg-teal-pale p-5"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-teal-brand"/><p className="text-sm leading-6 text-slate-700">The subscription covers the family’s allowed submissions for the current paid month. Continue to the final step once the family’s preferred nanny is shortlisted.</p></div>}
   </section>

   <section id="confirm-placement" className="scroll-mt-6 rounded-2xl border border-cream-300 bg-cream-50 p-5 sm:p-6">
    <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-sm font-bold text-white">04</span><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal-brand">Final step</p><h2 className="mt-1 text-lg font-semibold text-ink-900">Confirm placement</h2><p className="mt-1 text-sm leading-6 text-slate-600">Enter the agreed start date after all requirements below are complete. Confirmation updates the agency, family and nanny dashboards.</p></div></div>
    {placed?<AdminPlacementConfirmation candidates={[]} locked canManage={canManageMatching}/>:isNannyPlacement&&(!quoteReady||!feePaid)?<div className="rounded-xl border border-orange-300 bg-orange-50 p-5"><div className="flex items-start gap-3"><Clock3 size={20} className="mt-0.5 shrink-0 text-orange-700"/><div><p className="font-semibold text-orange-950">Placement confirmation is waiting</p><p className="mt-2 text-sm leading-6 text-orange-900">{!shortlistedMatches.length?"First shortlist an eligible nanny above.":!quoteReady?"Enter the family-agreed annual salary and publish the 15% fee in Step 3.":"The family must pay the published placement fee before you can confirm the start date."}</p></div></div></div>:<AdminPlacementConfirmation candidates={shortlistedMatches} requiredMatchId={isNannyPlacement?selectedFees?.matchId:null} locked={false} canManage={canManageMatching}/>}
   </section>
  </>}
 </section>;
}
