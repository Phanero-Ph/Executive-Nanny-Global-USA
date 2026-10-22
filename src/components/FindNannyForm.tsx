"use client";

import {useAgencyFees} from "./useAgencyFees";
import {feeMoney,feePercent} from "@/lib/fee-format";
import { useRef, useState } from "react";
import Link from "next/link";
import {FamilyRegistrationSuccess} from "./FamilyRegistrationSuccess";
import { Loader2, Send } from "lucide-react";

const inputCls = "application-input";
function Field({ label, name, type = "text", required = false, defaultValue, readOnly = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string; readOnly?: boolean; placeholder?:string }) {
  return <label className="block"><span className="application-label">{label}{required && <span className="text-ember-600"> *</span>}</span><input defaultValue={defaultValue} readOnly={readOnly} name={name} type={type} required={required} placeholder={placeholder} minLength={type === "password" ? 8 : undefined} autoComplete={type === "password" ? "new-password" : name === "name" ? "name" : name === "email" ? "email" : name === "phone" ? "tel" : undefined} className={inputCls} /></label>;
}
function Select({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) {
  return <label className="block"><span className="application-label">{label}{required && <span className="text-ember-600"> *</span>}</span><select name={name} required={required} defaultValue="" className={inputCls}><option value="">Select {label.toLowerCase()}</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}
function Choices({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) {
  return <fieldset><legend className="application-label">{label}{required && <span className="text-ember-600"> *</span>}</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map(option => <label key={option} className="application-choice"><input type="checkbox" name={name} value={option} className="h-4 w-4 accent-ember-500" />{option}</label>)}</div></fieldset>;
}
export function FindNannyForm({ account, initialCategory="caregiver" }: { initialCategory?:"nanny"|"caregiver"; account?: { name: string; email: string; phone: string | null } }) {
  const category=initialCategory;
  const {fees}=useAgencyFees();
  const [registration,setRegistration]=useState({created:false,email:"",verified:false});
  const submissionKey=useRef("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [babysitterCadence,setBabysitterCadence]=useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (!data.getAll("nannyTypes").length) { setError(category==="nanny"?"Select one care schedule.":"Select at least one care arrangement."); return; }
    if (data.get("password") !== data.get("confirmPassword")) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      if(!submissionKey.current)submissionKey.current=crypto.randomUUID();
      const body = { ...Object.fromEntries(data), careCategory:category, submissionKey:submissionKey.current, nannyTypes: data.getAll("nannyTypes"), childrenAges: data.getAll("childrenAges"), additionalCare: data.getAll("additionalCare") };
      const response = await fetch("/api/find-nanny", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit your request.");
      setRegistration({created:result.accountCreated===true,email:result.email||String(data.get("email")||""),verified:result.emailVerified===true});
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setLoading(false); }
  }
  if(done)return <FamilyRegistrationSuccess email={registration.email} title={registration.created?"Your family account is ready":"Request received!"} message={registration.created?category==="caregiver"?"Your family account has been created and your nanny request has been saved.":"Your family account has been created successfully.":category==="caregiver"?"Your nanny request is saved. Pay the search fee from your dashboard so our team can begin. A separate placement fee is due before work starts.":"Your babysitter request has been saved to your family account. Our team will guide your search."} verificationRequired={!registration.verified} href={registration.created?"/dashboard/family":category==="caregiver"?"/dashboard/family?view=caregiver":"/dashboard/family?view=requests"} linkLabel={registration.created?"Go to your family dashboard":"View your care requests"}/>;
  return <form onSubmit={submit} className="application-form">
    <section className="application-section rounded-xl border border-teal-border bg-teal-pale/50" aria-labelledby="selected-service-title"><h3 id="selected-service-title" className="text-lg text-ink-900">{category==="nanny"?"Babysitter placement":"Nanny placement"}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{category==="nanny"?(account?"An active paid plan is required. Each submitted babysitter request uses one monthly submission. Search and placement company fees are included.":"Create your family account, choose a subscription plan, then submit your babysitter request from the dashboard."):`Submit your requirements to get started. ${fees?`${feeMoney(fees.searchCents)} search fee; placement fee ${feePercent(fees.placementRateBps)} of the agreed annual salary. `:"A search fee applies, and the placement fee is based on the agreed annual salary. "}We will begin your search once your search fee payment is confirmed. Care provider wages are paid separately.`}</p>{category==="nanny"&&account&&<Link className="mt-3 inline-block text-xs font-medium text-teal-brand underline" href="/dashboard/family?view=membership">View subscription and submission allowance</Link>}</section>
    <FormSection number="01" title="Your details" description="How we can reach you about your search.">
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Full Name" name="name" defaultValue={account?.name} required /><Field label="Email" name="email" type="email" defaultValue={account?.email} readOnly={!!account} required />
      <Field label="Phone" name="phone" type="tel" defaultValue={account?.phone ?? undefined} required />
    </div>
    </FormSection>
    <FormSection number="02" title="Care for your family" description="Tell us when care is needed and who will be cared for.">
    <div className="grid gap-5 sm:grid-cols-2"><Field label={category==="nanny"?"First day of care":"Care Start Date"} name="startDate" type="date" required /><Select label="Number of Children" name="numberOfChildren" options={["1", "2", "3", "4", "5+"]} required={category==="nanny"} /></div>
    {category==="nanny"?<><div className="grid gap-5 sm:grid-cols-3"><label className="block"><span className="application-label">Care schedule <span className="text-ember-600">*</span></span><select name="nannyTypes" required value={babysitterCadence} onChange={event=>setBabysitterCadence(event.target.value)} className={inputCls}><option value="">Select a schedule</option><option value="One-time">One-time</option><option value="Recurring weekly">Recurring weekly</option></select></label><Field label="Start time" name="startTime" type="time" required/><Field label="End time" name="endTime" type="time" required/></div><label className="block"><span className="application-label">Preferred days and schedule details{babysitterCadence==="Recurring weekly"&&<span className="text-ember-600"> *</span>}</span><textarea name="schedule" rows={3} required={babysitterCadence==="Recurring weekly"} placeholder={babysitterCadence==="Recurring weekly"?"For example: Tuesday and Thursday each week":"Add any schedule notes (optional)"} className={inputCls}/></label></>:<Choices label="Care arrangement" name="nannyTypes" options={["Live-in", "Live-out", "Part-time", "Full-time"]} required/>}
    <Choices label="Children's Ages" name="childrenAges" options={["0-1 years", "2-4 years", "5-8 years", "9-12 years", "13+ years"]} required={category==="nanny"}/>
    </FormSection>
    <FormSection number="03" title={category==="nanny"?"Location & care notes":"Your home & preferences"} description={category==="nanny"?"Share the general location and any important care details.":"The practical details that help us find the right fit."}>
    {category==="nanny"?<div className="grid gap-5 sm:grid-cols-2"><Field label="Town / city" name="town" required placeholder="e.g. Branchburg"/><Field label="ZIP code" name="zip" placeholder="e.g. 08876 or 08876-1234"/></div>:<div className="grid gap-5 sm:grid-cols-2"><Select label="House Size" name="houseSize" options={["Small", "Medium", "Large", "Very Large"]}/><Field label="Town / city" name="town" required/><Field label="House Address" name="address" required/></div>}
    <Choices label={category==="nanny"?"Optional additional support":"Additional Care Needed"} name="additionalCare" options={category==="nanny"?["Meal preparation", "Homework help", "School pickup / transportation"]:["Light housekeeping", "Meal preparation", "Homework help", "Transportation", "Pet care"]}/>
    {category==="nanny"?<><Field label="Babysitting budget (optional)" name="budget" placeholder="For example, an hourly range"/><label className="block"><span className="application-label">Care needs and important notes (optional)</span><textarea name="careNeeds" rows={4} placeholder="Share allergies, routines, or other details the babysitter should know." className={inputCls}/></label></>:<><div className="grid gap-5 sm:grid-cols-2"><Field label="Salary Budget" name="budget"/><Select label="Service Duration" name="duration" options={["Temporary", "6 months", "1 year", "Long-term"]}/><Field label="Preferred care provider age" name="preferredNannyAge"/></div>{[{label:"Care requirements and who needs support",name:"hiringCriteria"},{label:"Previous childcare experience",name:"previousExperience"}].map(field=><label key={field.name} className="block"><span className="application-label">{field.label}</span><textarea required={field.name==="hiringCriteria"} name={field.name} rows={4} className={inputCls}/></label>)}</>}
    </FormSection>
    {!account && <FormSection number="04" title="Create your family account" description="Set a password to access your family dashboard.">
    <div className="grid gap-5 sm:grid-cols-2"><Field label="Password" name="password" type="password" required /><Field label="Confirm Password" name="confirmPassword" type="password" required /></div>
    <p className="text-xs leading-5 text-slate-500">Use at least 8 characters. Already have an account? <Link href="/login" className="text-ink-900 underline underline-offset-4">Log in to your dashboard.</Link></p>
    </FormSection>}
    <div className="application-actions">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {account && <p className="care-request-submit-note">Your request will be saved to your family account. Our team will be in touch about your search.</p>}
    <button disabled={loading} className="application-submit">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}{loading ? "Submitting request…" : "Submit request"}</button>
    </div>
  </form>;
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
 return <section id={`care-request-section-${number}`} className="application-section"><div className="mb-6 flex items-start gap-3"><span className="application-section-number">{number}</span><div><h3 className="text-lg text-ink-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div></div><div className="space-y-6">{children}</div></section>;
}
