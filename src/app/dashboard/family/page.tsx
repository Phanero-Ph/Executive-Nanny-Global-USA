import {careCategoryLabel} from "@/lib/care-category";

import {FamilyNannyAction} from "@/components/FamilyNannyAction";

import {hasPaidFamilyMembership} from "@/lib/family-membership";

import {LockKeyhole} from "lucide-react";

import { CaregiverFeePayments } from "@/components/CaregiverFeePayments";

import { BookingPanel } from "@/components/BookingPanel";

import { MembershipPanel } from "@/components/MembershipPanel";

import { MatchingPanel } from "@/components/MatchingPanel";

import type { Metadata } from "next";

import Link from "next/link";

import { redirect } from "next/navigation";

import { Plus, ArrowUpRight, CalendarCheck, ShieldCheck, MessageSquareText, ClipboardCheck, ChevronRight } from "lucide-react";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";

import { familyRequests,careBookings,nannyMatches,nannyApplications } from "@/db/schema";

import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";

import { FamilyProfile } from "@/components/FamilyProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Family Dashboard", robots: { index: false, follow: false } };

const STATUSES: Record<string, { label: string; next: string; stage: number }> = {

 lead: { label: "Request received", next: "Our team will contact you to discuss your care needs.", stage: 0 },

 search_fee_invoiced: { label: "Search fee due", next: "Pay your nanny search fee below so our team can start searching.", stage: 0 },

 search_fee_paid: { label: "Search active", next: "Your search can begin. Our team will keep you updated.", stage: 1 },

 searching: { label: "Recruiter searching", next: "We are looking for care providers who fit your family's needs.", stage: 1 },

 shortlist: { label: "Shortlist ready", next: "Our agency is reviewing the shortlist to select your match.", stage: 2 },

 placement_fee_due: {label:"Placement fee due",next:"The agency has selected your nanny. Pay the placement fee below before the nanny starts work.",stage:2},

 placed: { label: "Placed", next: "Your nanny has been placed with your family. Contact us if you need support.", stage: 3 },

};

function date(value: Date) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(value); }

import {DashboardHeading,DashboardStat,DashboardAction} from "@/components/DashboardElements";

import {BOOKING_LABELS,bookingTime} from "@/lib/bookings";

export default async function FamilyDashboardPage({searchParams}:{searchParams:Promise<{billing?:string;view?:string;fee?:string;requestId?:string;locked?:string}>}) {

 const {billing:billingReturn,view:requestedView,fee:feeReturn,requestId:feeRequestId,locked}=await searchParams;

 const user=await getCurrentUser();if(!user)redirect("/login");if(user.role==="admin")redirect("/dashboard/admin");if(user.role!=="family")redirect("/dashboard/nanny");

 const subscribed=await hasPaidFamilyMembership(user.id);

 if(requestedView==="matches"&&!subscribed)redirect("/dashboard/family?view=membership&locked=nanny");

 const nannyHref=subscribed?"/dashboard/family/new":"/dashboard/family?view=membership&locked=nanny";

 const view=feeReturn?"caregiver":["requests","caregiver","caregiver-shortlist","bookings","matches","history","membership","profile"].includes(requestedView??"")?requestedView:billingReturn?"membership":"overview";

 const [requests,bookings,matches]=await Promise.all([

  db.select().from(familyRequests).where(eq(familyRequests.userId,user.id)).orderBy(desc(familyRequests.createdAt)),

  db.select({id:careBookings.id,status:careBookings.status,startsAt:careBookings.startsAt,endsAt:careBookings.endsAt,town:careBookings.town}).from(careBookings).where(eq(careBookings.familyId,user.id)).orderBy(desc(careBookings.startsAt)),

  db.select({id:nannyMatches.id,status:nannyMatches.status,requestStatus:familyRequests.status,applicationStatus:nannyApplications.status}).from(nannyMatches).innerJoin(familyRequests,eq(nannyMatches.familyRequestId,familyRequests.id)).innerJoin(nannyApplications,eq(nannyMatches.nannyApplicationId,nannyApplications.id)).where(eq(familyRequests.userId,user.id))

 ]);

 const placed=requests.filter(r=>r.status==="placed").length,open=requests.filter(r=>!["placed","closed","cancelled"].includes(r.status)).length;

 const upcoming=bookings.filter(b=>!["cancelled","completed"].includes(b.status)&&b.endsAt.getTime()>new Date().getTime()).sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime());

 const titles:Record<string,[string,string]>={overview:[`Welcome back, ${user.name.split(" ")[0]}.`,"A clear view of your childcare, your requests, and what comes next."],requests:[subscribed?"Request a Babysitter":"Babysitter request history","Follow your babysitter search and see the next steps from our team."],"caregiver-shortlist":["Nanny Shortlist","Explore the candidates our agency selected for your family and see how their experience fits your care needs."],caregiver:["Request a Nanny","Track your nanny search, fee payments and placement."],bookings:["Scheduled care","Review your previously scheduled care bookings."],history:["Your matching history","Review your existing matches and placement records."],matches:["Babysitter Shortlist","Get to know your matches and coordinate the next step with our team."],membership:["Membership & billing","Manage your plan, usage and payments."],profile:["Your family profile","Keep your contact details current so our team can reach you."]};

 const [title,description]=titles[view!];

 const caregiverView=view==="caregiver";

 const visibleRequests=requests.filter(request=>request.careCategory===(caregiverView?"caregiver":"nanny"));

 const returnedFeeRequest=feeRequestId?visibleRequests.find(request=>request.id===feeRequestId):visibleRequests[0];

 const requestSection=<section className="min-w-0 rounded-2xl border border-cream-300 bg-white p-6 sm:p-8"><h2 className="text-2xl text-ink-900">{caregiverView?"Your nanny requests":"Your babysitter requests"}</h2><p className="mt-2 text-sm text-slate-500">Updates from our team appear here as your search progresses.</p>

    {!visibleRequests.length ? <div className="mt-7 rounded-xl bg-cream-50 p-8 text-center"><CalendarCheck className="mx-auto h-9 w-9 text-teal-brand" aria-hidden="true" /><h3 className="mt-4 text-lg text-ink-900">Your search starts here</h3><p className="mt-2 text-sm text-slate-500">Tell us what your family needs and we will help you take the next step.</p><div className="mt-5 flex justify-center">{caregiverView?<Link href="/dashboard/family/book" className="application-secondary">Create your first request</Link>:<FamilyNannyAction subscribed={subscribed}/>}</div></div> : <ul className="mt-7 space-y-5">{visibleRequests.map(request => {

     const status = request.status==="placed"?STATUSES.placed:request.careCategory==="caregiver"&&request.placementFeeStatus==="paid"?{label:"Placement fee paid",next:"Your payment is confirmed. The agency will coordinate your nanny’s start date.",stage:2}:STATUSES[request.status] ?? { label: "Under review", next: "Contact our team for an update on this request.", stage: 0 };

     return <li key={request.id} className="min-w-0 rounded-xl border border-cream-300 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg text-ink-900">{request.careCategory==="caregiver"?"Nanny":"Babysitter"} · {request.serviceType}</h3><p className="mt-1 text-xs text-slate-500">Submitted {date(request.createdAt)} · Request {request.id.slice(0,8)}</p></div><span className="rounded-full bg-teal-pale px-3 py-1.5 text-xs font-semibold text-ink-900">{status.label}</span></div>

      <ol aria-label="Search progress" className="mt-6 grid grid-cols-4 gap-2">{["Received", "Searching", "Shortlisted", "Placed"].map((label,index) => <li key={label} aria-current={index === status.stage ? "step" : undefined}><div className={`h-1 rounded-full ${index <= status.stage ? "bg-teal-brand" : "bg-cream-300"}`} /><p className={`mt-2 text-[10px] sm:text-xs ${index <= status.stage ? "text-ink-900" : "text-slate-400"}`}>{label}</p></li>)}</ol>

      <p className="mt-5 rounded-lg bg-cream-50 p-3 text-sm leading-6 text-slate-600"><strong className="font-medium text-ink-900">Next step: </strong>{status.next}</p>

      {request.careCategory==="caregiver"&&<CaregiverFeePayments requestId={request.id} status={request.status} searchStatus={request.searchFeeStatus} placementStatus={request.placementFeeStatus}/>}

      <details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-ink-900">View request details</summary><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{[{label:"Care start date",value:request.startDate},{label:"Service duration / schedule",value:request.schedule},{label:"Budget",value:request.budget},{label:"Search fee status",value:request.careCategory === "nanny" || request.searchFeeStatus === "included" ? "Included in subscription" : request.searchFeeStatus === "paid" ? "Paid" : request.searchFeeStatus === "unpaid" ? "Unpaid" : request.searchFeeStatus},{label:"Care needs",value:request.childrenInfo},{label:"Location",value:[request.town,request.zip].filter(Boolean).join(" ")},{label:"Contact",value:`${request.name} · ${request.phone || request.email}`}].map(item => <div key={item.label}><dt className="text-xs text-slate-400">{item.label}</dt><dd className="mt-1 whitespace-pre-line break-words text-slate-600">{item.value || "Not specified"}</dd></div>)}{request.message && <div className="sm:col-span-2"><dt className="text-xs text-slate-400">Home & preferences</dt><dd className="mt-1 whitespace-pre-line break-words leading-6 text-slate-600">{request.message}</dd></div>}</dl></details>

     </li>;

    })}</ul>}

   </section>;

 return <section className={`application-page ${view==="caregiver-shortlist"?"family-shortlist-page":""}`}><div><DashboardHeading eyebrow="Family workspace" title={title} description={description}>{view==="caregiver-shortlist"?<><Link href="/dashboard/family?view=caregiver" className="application-secondary"><ArrowUpRight size={15} aria-hidden="true"/>Requests & fees</Link><Link href="/dashboard/family/book" className="application-submit"><Plus size={16} aria-hidden="true"/>Request a Nanny</Link></>:view==="caregiver"?<Link href="/dashboard/family/book" className="application-submit"><Plus size={16} aria-hidden="true"/>Request a Nanny</Link>:view!=="membership"&&view!=="profile"?<FamilyNannyAction subscribed={subscribed}/>:undefined}</DashboardHeading>

 {view==="overview"&&<>

  <div className="dashboard-stats"><DashboardStat label="Request a Babysitter" value={requests.filter(r=>r.careCategory==="nanny").length} detail="Your family's care searches" icon="request"/><DashboardStat label="Open searches" value={open} detail={`${placed} completed ${placed===1?"placement":"placements"}`} icon="care"/><DashboardStat label="Request a Nanny" value={requests.filter(r=>r.careCategory==="caregiver").length} detail="Your nanny placement searches" icon="booking"/><DashboardStat label="Care matches" value={matches.filter(m=>m.status!=="closed"&&!(m.applicationStatus==="placed"&&m.requestStatus!=="placed")).length} detail="Candidates linked to your family" icon="people"/></div>

  {!requests.length&&<div className="dashboard-welcome"><div><p className="!mt-0 !text-[10px] uppercase tracking-[.15em] !text-ember-400">A great match starts with you</p><h2 className="mt-3">Care that fits your family.</h2><p>Tell us about your routine, your children, and the support you need. We will guide you from your first request to the right match.</p></div><FamilyNannyAction subscribed={subscribed} label="Find your babysitter"/></div>}

  <div className="dashboard-actions"><DashboardAction title="Request a Babysitter" description={subscribed?"Start a personalised care search":"Subscription required · View plans"} href={nannyHref} icon="people" locked={!subscribed}/><DashboardAction title="Request a Nanny" description="Request care when you need it" href="/dashboard/family/book" icon="booking"/><DashboardAction title="Your membership" description="Review your plan and allowance" href="/dashboard/family?view=membership" icon="care"/></div>

  <div className="dashboard-overview-grid"><div className="space-y-6"><section className="dashboard-card"><div className="dashboard-card-title"><h2>Recent requests</h2><Link href="/dashboard/family?view=requests">View all requests →</Link></div>{requests.length?<div>{requests.slice(0,3).map(r=><div className="dashboard-list-row" key={r.id}><div><h3>{careCategoryLabel(r.careCategory)} · {r.serviceType}</h3><p>{date(r.createdAt)} · Request {r.id.slice(0,8)}</p><p className="!text-slate-600">{STATUSES[r.status]?.next??"Contact our team for an update."}</p></div><span className={`dashboard-status ${r.status==="placed"?"":"pending"}`}>{STATUSES[r.status]?.label??"Under review"}</span></div>)}</div>:<div className="dashboard-empty"><CalendarCheck size={27} className="mx-auto text-teal-brand" aria-hidden="true"/><h3 className="mt-3 text-sm text-ink-900">Your search starts here</h3><p>Request a Babysitter and progress updates will appear here once you get started.</p></div>}</section><section className="dashboard-card"><div className="dashboard-card-title"><h2>Upcoming care</h2><Link href="/dashboard/family?view=bookings">View bookings →</Link></div>{upcoming.length?upcoming.slice(0,3).map(b=><div key={b.id} className="dashboard-list-row"><div><h3>{b.town}</h3><p>{bookingTime(b.startsAt)}</p></div><span className="dashboard-status">{BOOKING_LABELS[b.status]??b.status}</span></div>):<p className="py-5 text-xs leading-6 text-slate-500">No upcoming care bookings. Request a Nanny whenever you need extra support.</p>}</section></div><aside className="space-y-6"><section className="dashboard-card"><div className="dashboard-card-title"><h2>Your next steps</h2></div><div className="dashboard-checklist">{[{title:"Complete your family profile",detail:user.emailVerifiedAt?"Your email is verified. Keep your phone number current.":"Add your phone number and verify your email.",href:"/dashboard/family?view=profile",done:!!user.phone&&!!user.emailVerifiedAt},{title:"Tell us about your care needs",detail:requests.length?"Review your request status and any outstanding fees.":"Share your schedule, preferences and care needs.",href:"/dashboard/family?view=requests",done:requests.length>0},{title:"Review your matches",detail:matches.length?"Review your shortlist and arrange the next step.":"Your matches will appear as your search progresses.",href:subscribed?"/dashboard/family?view=matches":"/dashboard/family?view=history",done:matches.some(m=>m.status!=="closed")}].map((step,i)=><Link key={step.title} href={step.href}><span className={step.done?"done":""}>{step.done?"✓":i+1}</span><span><strong>{step.title}</strong><small>{step.detail}</small></span></Link>)}</div></section><section className="dashboard-card"><h2>We&apos;re here for your family.</h2><p className="mt-3 text-xs leading-6 text-slate-500">Questions about a search, a booking, or your plan? Get a little guidance from our team.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-teal-brand">Contact the agency<ArrowUpRight size={14} aria-hidden="true"/></Link></section></aside></div>

 </>}

 {(view==="requests"||view==="caregiver")&&<>{feeReturn==="success"&&<p role="status" className="mb-5 rounded-xl bg-teal-pale p-4 text-sm text-ink-900">{returnedFeeRequest?.searchFeeStatus==="paid"?"Search fee confirmed. Your request is now available to our team, and the search can begin.":returnedFeeRequest?.searchFeeStatus==="refunded"?"This search fee was refunded. Please contact our team before continuing.":"Stripe returned you from checkout, but the search fee has not yet been confirmed in your request. The request will reach our team once confirmation is recorded. Refresh this page in a moment if the status below is still pending."}</p>}{feeReturn==="cancelled"&&<p className="mb-5 text-sm text-slate-500">Fee checkout was cancelled. You can resume payment below.</p>}{requestSection}{view==="caregiver"&&<Link href="/dashboard/family?view=caregiver-shortlist" className="application-secondary mt-6">View nanny shortlist<ArrowUpRight size={15} aria-hidden="true"/></Link>}</>}{view==="bookings"&&<BookingPanel role="family" userId={user.id}/>} {view==="caregiver-shortlist"&&<><section className="shortlist-intro" aria-label="About your nanny shortlist"><div className="shortlist-intro-main"><span className="shortlist-intro-icon"><ShieldCheck size={21} aria-hidden="true"/></span><div><p className="shortlist-intro-kicker">CURATED BY YOUR AGENCY</p><h2>A thoughtful shortlist, built around your family</h2><p>Your recruiter selected these candidates based on your care needs, schedule, and preferences. Review their profiles, then message your recruiter with questions or next steps.</p></div></div><div className="shortlist-steps"><div><span>01</span><strong>Review the profiles</strong><small>Experience, care fit and availability</small></div><ChevronRight className="shortlist-step-arrow" size={17} aria-hidden="true"/><div><span>02</span><strong>Talk with your recruiter</strong><small>Use the private agency message option</small></div><ChevronRight className="shortlist-step-arrow" size={17} aria-hidden="true"/><div><span>03</span><strong>Confirm placement details</strong><small>Placement fee is due before work begins</small></div></div></section><div className="shortlist-toolbar"><div><span className="shortlist-toolbar-icon"><ClipboardCheck size={17} aria-hidden="true"/></span><div><h2>Your shortlisted nannies</h2><p>Agency screening and credential checks are shown as summaries.</p></div></div><Link href="/dashboard/messages" className="shortlist-contact-link"><MessageSquareText size={15} aria-hidden="true"/>Message the agency<ArrowUpRight size={14} aria-hidden="true"/></Link></div><div className="shortlist-match-panel"><MatchingPanel role="family" userId={user.id} careCategory="caregiver"/></div><p className="shortlist-privacy"><ShieldCheck size={14} aria-hidden="true"/>Your shortlist is private to your family and the agency. Sensitive documents and reference contact details are never displayed here.</p></>}{view==="matches"&&<MatchingPanel role="family" userId={user.id} careCategory="nanny"/>}{view==="history"&&<MatchingPanel role="family" userId={user.id} history/>} {view==="membership"&&<>{locked==="nanny"&&!subscribed&&<section className="mb-6 rounded-2xl border border-cream-300 bg-white p-6" aria-labelledby="subscription-required-title"><div className="flex items-start gap-3"><LockKeyhole size={22} className="shrink-0 text-teal-brand"/><div><h2 id="subscription-required-title">Subscription required</h2><p className="mt-2 text-sm leading-7 text-slate-500">Choose a monthly plan to unlock babysitter requests and your shortlist.</p></div></div></section>}{subscribed&&<section className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-teal-border bg-teal-pale p-6" aria-labelledby="babysitter-ready-title"><div><p className="dashboard-eyebrow">SUBSCRIPTION ACTIVE</p><h2 id="babysitter-ready-title" className="mt-2 text-xl text-ink-900">Ready to request a babysitter?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Your plan is active. Complete and submit the request form when ready; a monthly submission is counted when you submit.</p></div><Link href="/dashboard/family/new" className="application-submit"><Plus size={16} aria-hidden="true"/>Start babysitter request</Link></section>}<MembershipPanel userId={user.id} billingReturn={billingReturn}/></>} {view==="profile"&&<div className="max-w-2xl dashboard-card"><h2 className="mb-6">Contact information</h2><FamilyProfile name={user.name} email={user.email} phone={user.phone} verified={!!user.emailVerifiedAt}/></div>}

 </div></section>;

}
