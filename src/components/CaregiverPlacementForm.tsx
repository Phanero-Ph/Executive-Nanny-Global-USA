"use client";

import {useAgencyFees} from "./useAgencyFees";

import {feeMoney,feePercent} from "@/lib/fee-format";

import {useRef,useState} from "react";

import Link from "next/link";

import {ArrowRight,CalendarDays,CheckCircle2,Loader2,MapPin,ShieldCheck,StickyNote,UserRound} from "lucide-react";

import {CaregiverFeePayments} from "./CaregiverFeePayments";



export function CaregiverPlacementForm({account}:{account:{name:string;email:string;phone:string|null}}){

 const {fees}=useAgencyFees();

 const key=useRef<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[requestId,setRequestId]=useState<string|null>(null);

 async function submit(form:FormData){

  setError("");
  const nannyTypes=form.getAll("nannyTypes").map(String);
  if(!nannyTypes.length){setError("Select at least one type of nanny needed.");return;}
  setBusy(true);key.current??=crypto.randomUUID();

  const fields=Object.fromEntries(form.entries());

  try{

   const response=await fetch("/api/find-nanny",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...fields,careCategory:"caregiver",submissionKey:key.current,nannyTypes,childrenAges:form.getAll("childrenAges"),additionalCare:form.getAll("additionalCare")})});

   const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to submit your nanny request.");

   setRequestId(data.requestId);

  }catch(e){setError(e instanceof Error?e.message:"Unable to submit your request. Please try again.");}

  finally{setBusy(false);}

 }

 if(requestId)return <div className="caregiver-form-card" role="status"><CheckCircle2 className="text-teal-brand" size={30} aria-hidden="true"/><h2 className="mt-4 text-xl text-ink-900">Your nanny request is saved</h2><p className="mt-3 text-sm leading-7 text-slate-500">Your request will be sent to our team once your search fee payment is confirmed. You can review your requirements and track your shortlist and placement from your dashboard.</p><CaregiverFeePayments requestId={requestId} status="search_fee_invoiced" searchStatus="unpaid" placementStatus="unpaid"/><Link href="/dashboard/family?view=caregiver" className="application-secondary mt-5">View nanny requests<ArrowRight size={15} aria-hidden="true"/></Link></div>;

 return <form action={submit} className="caregiver-form" aria-busy={busy}><fieldset disabled={busy}>

  <legend className="sr-only">Nanny placement requirements</legend>

  <section className="caregiver-form-card"><div className="caregiver-section-heading"><span><UserRound size={20} aria-hidden="true"/></span><div><p>01 · YOUR FAMILY</p><h2>Tell us about your family</h2></div></div><p className="caregiver-section-description">Share your needs and preferences so we can match you with a suitable nanny.</p><div className="caregiver-field-grid"><label><span className="application-label">Full name <span>*</span></span><input name="name" required maxLength={255} defaultValue={account.name} autoComplete="name" className="application-input"/></label><label><span className="application-label">Email <span>*</span></span><input name="email" type="email" readOnly value={account.email} autoComplete="email" className="application-input"/></label><label><span className="application-label">Phone <span>*</span></span><input name="phone" type="tel" required maxLength={50} defaultValue={account.phone??""} autoComplete="tel" className="application-input"/></label><label><span className="application-label">Care start date <span>*</span></span><input name="startDate" type="date" required className="application-input"/></label></div></section>

  <section className="caregiver-form-card"><div className="caregiver-section-heading"><span><CalendarDays size={20} aria-hidden="true"/></span><div><p>02 · YOUR PREFERENCES</p><h2>What kind of nanny do you need?</h2></div></div><p className="caregiver-section-description">Select every arrangement that could work for your family, then share a few details about your care needs.</p><fieldset><legend className="application-label">Type of nanny needed <span>*</span></legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{["Live-in","Live-out","Part-time","Full-time"].map(value=><label key={value} className="application-choice"><input type="checkbox" name="nannyTypes" value={value} className="h-4 w-4 accent-ember-500"/>{value}</label>)}</div></fieldset><div className="caregiver-field-grid mt-5"><label><span className="application-label">Number of children <span>*</span></span><select name="numberOfChildren" required defaultValue="" className="application-input"><option value="">Select number</option>{["1","2","3","4","5+"].map(value=><option key={value}>{value}</option>)}</select></label><label><span className="application-label">House size</span><select name="houseSize" defaultValue="" className="application-input"><option value="">Select size</option>{["Small","Medium","Large","Very Large"].map(value=><option key={value}>{value}</option>)}</select></label><label><span className="application-label">Salary budget</span><input name="budget" maxLength={255} placeholder="e.g. $52,000 per year" className="application-input"/></label><label><span className="application-label">Service duration</span><select name="duration" defaultValue="" className="application-input"><option value="">Select duration</option>{["Temporary","6 months","1 year","Long-term"].map(value=><option key={value}>{value}</option>)}</select></label><label><span className="application-label">Preferred nanny age</span><input name="preferredNannyAge" maxLength={100} placeholder="e.g. 30–50 years" className="application-input"/></label></div><div className="caregiver-fields mt-5"><fieldset><legend className="application-label">Children’s ages</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{["0-1 years","2-4 years","5-8 years","9-12 years","13+ years"].map(value=><label key={value} className="application-choice"><input type="checkbox" name="childrenAges" value={value} className="h-4 w-4 accent-ember-500"/>{value}</label>)}</div></fieldset><fieldset><legend className="application-label">Additional care needed</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{["Light housekeeping","Meal preparation","Homework help","Transportation","Pet care"].map(value=><label key={value} className="application-choice"><input type="checkbox" name="additionalCare" value={value} className="h-4 w-4 accent-ember-500"/>{value}</label>)}</div></fieldset></div></section>

  <section className="caregiver-form-card"><div className="caregiver-section-heading"><span><MapPin size={20} aria-hidden="true"/></span><div><p>03 · YOUR LOCATION</p><h2>Where will care take place?</h2></div></div><label><span className="application-label">House address <span>*</span></span><textarea name="address" maxLength={1000} required rows={3} autoComplete="street-address" placeholder="Street address, town or city, state and ZIP code" className="application-input"/></label><p className="caregiver-field-hint"><ShieldCheck size={14} aria-hidden="true"/>Include your town or city so we can identify nannies who serve your area.</p></section>

  <section className="caregiver-form-card"><div className="caregiver-section-heading"><span><StickyNote size={20} aria-hidden="true"/></span><div><p>04 · YOUR CRITERIA</p><h2>Tell us what matters most</h2></div></div><label className="block"><span className="application-label">Hiring criteria</span><textarea name="hiringCriteria" maxLength={3000} rows={5} placeholder="Describe your children’s routines, responsibilities, and qualities you value in a nanny." className="application-input"/></label><label className="mt-5 block"><span className="application-label">Previous nanny experience</span><textarea name="previousExperience" maxLength={3000} rows={4} placeholder="Share any previous nanny arrangements or experience that would help us understand your preferences." className="application-input"/></label><p className="caregiver-field-hint">The more detail you provide, the more accurately our team can match your family.</p></section>

  <div className="caregiver-form-footer"><p>No subscription is required. After submitting, pay the {fees?feeMoney(fees.searchCents):"applicable"} search fee. A separate {fees?feePercent(fees.placementRateBps):""} of the agreed annual salary placement fee is due after the agency selects a nanny, before work starts. Nanny wages are separate.</p><button disabled={busy} className="application-submit">{busy&&<Loader2 size={17} className="animate-spin" aria-hidden="true"/>}{busy?"Submitting…":"Submit nanny request"}{!busy&&<ArrowRight size={16} aria-hidden="true"/>}</button></div>

 </fieldset>{error&&<p role="alert" className="caregiver-form-error">{error}</p>}</form>;

}
