"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {RegistrationSuccess} from "./RegistrationSuccess";
import type { ApplicationData } from "@/lib/application-data";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { APPLICATION_STEPS, REFERENCE_FIELDS, WORK_FIELDS, LANGUAGE_FIELDS, type ApplicationField } from "@/data/nanny-application";
type Values = Record<string, string>;
function Control({ field, value, change, prefix = "", readOnly = false }: { readOnly?: boolean; field: ApplicationField; value: string; change: (value: string) => void; prefix?: string }) {
 const label = <>{field.label}{field.required && <span className="text-ember-600"> *</span>}</>;
 if (field.type === "radio") return <fieldset className="sm:col-span-2"><legend className="application-label">{label}</legend><div className="flex flex-wrap gap-3">{field.options?.map(option => <label key={option} className="application-choice min-w-24"><input type="radio" name={`${prefix}${field.name}`} required={field.required} checked={value === option} onChange={() => change(option)} />{option}</label>)}</div></fieldset>;
 if (field.type === "checkbox") return <label className="application-choice"><input type="checkbox" checked={value === "Yes"} onChange={event => change(event.target.checked ? "Yes" : "No")} />{label}</label>;
 return <label className={field.type === "textarea" ? "block sm:col-span-2" : "block"}><span className="application-label">{label}</span>{field.type === "select" ? <select value={value} required={field.required} onChange={event => change(event.target.value)} className="application-input"><option value="">Select an option</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea value={value} required={field.required} onChange={event => change(event.target.value)} rows={4} className="application-input" /> : <input readOnly={readOnly} type={field.type || "text"} value={value} required={field.required} min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? 80 : undefined} minLength={field.type === "password" ? 8 : undefined} maxLength={field.type === "password" ? 128 : undefined} autoComplete={field.type === "password" ? "new-password" : undefined} onChange={event => change(event.target.value)} className="application-input" />}</label>;
}
function Upload({ label, accept, file, change, required = false }: { label: string; accept: string; file: File | null; change: (file: File | null) => void; required?: boolean }) {
 return <label className="block sm:col-span-2"><span className="application-label">{label}{required && <span className="text-ember-600"> *</span>}</span><input type="file" accept={accept} required={required && !file} onChange={event => change(event.target.files?.[0] || null)} className="application-file" />{file && <span className="mt-2 block text-xs text-teal-brand">Selected: {file.name}</span>}</label>;
}
function RepeatedGroup({ title, fields, rows, change, minimum }: { title: string; fields: ApplicationField[]; rows: Values[]; change: (rows: Values[]) => void; minimum: number }) {
 return <div className="space-y-5"><h3 className="text-lg text-ink-900">{title}</h3>{rows.map((row, index) => <fieldset key={index} className="rounded-xl border border-cream-300 bg-cream-50/50 p-5"><legend className="px-2 text-sm font-semibold text-ink-900">{title} {index + 1}</legend><div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{fields.map(field => <Control key={field.name} field={field} prefix={`${title}${index}`} value={row[field.name] || ""} change={value => change(rows.map((item, i) => i === index ? { ...item, [field.name]: value } : item))} />)}</div>{rows.length > minimum && <button type="button" onClick={() => change(rows.filter((_, i) => i !== index))} className="mt-4 text-sm text-ember-600">Remove</button>}</fieldset>)}<button type="button" onClick={() => change([...rows, {}])} className="application-secondary">Add another {title.toLowerCase()}</button></div>;
}
export function NannyApplyForm({ initial, applicationId, account }: { initial?: ApplicationData; applicationId?: string; account?: { name: string; email: string; phone: string | null } }) {
 const router=useRouter();
 const [step, setStep] = useState(0), [values, setValues] = useState<Values>(initial?.values ?? { country: "United States", firstName: account?.name.split(" ")[0] ?? "", lastName: account?.name.split(" ").slice(1).join(" ") ?? "", email: account?.email ?? "", phone: account?.phone ?? "" });
 const [references, setReferences] = useState<Values[]>(initial?.references.length ? initial.references : [{}, {}]), [workHistory, setWorkHistory] = useState<Values[]>(initial?.workHistory.length ? initial.workHistory : [{}]), [languages, setLanguages] = useState<Values[]>(initial?.languages.length ? initial.languages : [{}]);
 const [photo, setPhoto] = useState<File | null>(null), [cv, setCv] = useState<File | null>(null), [resume, setResume] = useState<File | null>(null);
 const savedAttachment=(field:string)=>initial?.attachments.find(item=>item.field===field);
 const [error, setError] = useState(""), [loading, setLoading] = useState(false), [savingDraft,setSavingDraft]=useState(false), [done, setDone] = useState(false);
 const [confirmation,setConfirmation]=useState({email:""});
 const heading = useRef<HTMLHeadingElement>(null), previousStep = useRef(0);
 useEffect(() => { if (previousStep.current === step) return; previousStep.current = step; heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [step]);
 const update = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }));
 const draftPayload=()=>({action:"saveDraft",values,references,workHistory,languages:values.speaksOtherLanguages==="Yes"?languages:[]});
 async function saveDraft(){
  if(!applicationId)throw new Error("Your draft is not ready yet. Refresh the page and try again.");
  const response=await fetch(`/api/nanny/applications/${applicationId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(draftPayload())});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||"Could not save your application draft.");
 }
 async function saveAndExit(){
  setError("");setSavingDraft(true);
  try{await saveDraft();router.push("/dashboard/nanny");router.refresh();}
  catch(err){setError(err instanceof Error?err.message:"Could not save your application draft.");}
  finally{setSavingDraft(false);}
 }
 async function submit(event: React.FormEvent) {
  event.preventDefault(); setError("");
  if (step < APPLICATION_STEPS.length - 1) {
   setSavingDraft(true);
   try{await saveDraft();setStep(step+1);}catch(err){setError(err instanceof Error?err.message:"Could not save your application draft.");}finally{setSavingDraft(false);}
   return;
  }
  setLoading(true);
  try {
   const data = new FormData(); data.set("application", JSON.stringify({ values, references, workHistory, languages: values.speaksOtherLanguages === "Yes" ? languages : [] }));
   if (photo) data.set("photo", photo); if (cv) data.set("cv", cv); if (resume) data.set("resume", resume);
   const response = await fetch("/api/nanny-apply", { method: "POST", body: data }); const result = await response.json();
   if (!response.ok) throw new Error(result.error || "Couldn't submit your application.");
   setConfirmation({email:result.email||account?.email||values.email?.trim().toLowerCase()||""});
   setValues({}); setPhoto(null); setCv(null); setResume(null); setDone(true);
  } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); } finally { setLoading(false); }
 }
 if(done)return <RegistrationSuccess role="nanny" email={confirmation.email} title="Application submitted!" message="Your completed application has been sent to the agency for review. Our team will contact you with the next steps." verificationRequired={false} href="/dashboard/nanny" nannyApplicationSubmitted/>;
 const fields = APPLICATION_STEPS[step].fields.filter(field => (field.name !== "childrenAges" || values.isMother === "Yes") && !["password", "confirmPassword"].includes(field.name));
 const details = ["firstName", "lastName", "dateOfBirth", "email", "phone", "homeAddress", "zipcode", "country", "preferredContactMethod"];
 const groups = step === 0 ? [{ title: "About you", fields: fields.filter(field => details.includes(field.name)) }, { title: "Work & lifestyle", fields: fields.filter(field => !details.includes(field.name)) }].filter(group => group.fields.length) : [{ title: "", fields }];
 return <div>
  <div className="border-b border-cream-300 bg-cream-50/60 px-6 py-6 sm:px-9"><div className="flex items-center justify-between gap-3"><span className="application-kicker">YOUR APPLICATION</span><span className="text-xs text-slate-500">Step {step + 1} of 7</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cream-300" role="progressbar" aria-label="Application progress" aria-valuemin={1} aria-valuemax={7} aria-valuenow={step + 1}><div className="h-full rounded-full bg-teal-brand transition-all" style={{ width: `${((step + 1) / 7) * 100}%` }} /></div>
   <ol className="mt-5 flex justify-between gap-1" aria-label="Application steps">{APPLICATION_STEPS.map((item, index) => <li key={item.title} aria-current={index === step ? "step" : undefined} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${index === step ? "bg-ink-900 text-white" : index < step ? "bg-teal-pale text-teal-brand" : "border border-cream-300 bg-white text-slate-400"}`}>{index < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}</span><span className={`hidden text-[10px] leading-4 xl:block ${index === step ? "text-ink-900" : "text-slate-500"}`}>{["Personal", "Experience", "Availability", "Education", "References", "Interests", "Finish"][index]}</span><span className="sr-only">{item.title}</span></li>)}</ol>
  </div>
  <form onSubmit={submit} className="application-form"><div className="px-6 pb-2 pt-7 sm:px-9"><h2 ref={heading} tabIndex={-1} className="scroll-mt-28 text-2xl text-ink-900 outline-none">{APPLICATION_STEPS[step].title}</h2><p className="mt-2 text-sm text-slate-500">{["Let's start with a little about you and how to reach you.", "Help us understand the care and experience you bring.", "Tell us when you're available and what you're looking for.", "Share your education and an emergency contact.", "Introduce us to the people and experience behind your work.", "Tell us more about your interests and care needs.", "A few final details before you send your application."][step]} <span className="text-ember-600">*</span> Required fields</p>{step===6&&<div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-slate-700"><strong className="block text-ink-900">After you submit, provide your CPR and First Aid certificates.</strong><span className="mt-1 block">These current documents are required before matching. You can upload PDF copies from your nanny dashboard under <strong>Your credentials</strong>. The agency conducts your background check; you do not need to upload a background-check document.</span></div>}</div>
   {groups.map(group => <section key={group.title} className="application-section">{group.title && <h3 className="mb-5 text-base text-ink-900">{group.title}</h3>}<div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
    {step === 0 && group.title === "About you" && <><Upload label="Professional Photo (PNG/JPEG)" accept="image/png,image/jpeg" file={photo} change={setPhoto} required={!savedAttachment("photo")} />{savedAttachment("photo")&&<p className="-mt-3 text-xs text-slate-500">Already on file: {savedAttachment("photo")?.name}. Choose a new file only if you want to replace it.</p>}</>}
    {group.fields.map(field => <Control key={field.name} field={field} readOnly={field.name === "email"} value={values[field.name] || ""} change={value => update(field.name, value)} />)}
    {step === 0 && group.title === "Work & lifestyle" && <><Upload label="Attach your CV" accept=".pdf,.doc,.docx" file={cv} change={setCv} />{savedAttachment("cv")&&<p className="-mt-3 text-xs text-slate-500">Already on file: {savedAttachment("cv")?.name}. Choose a new file only if you want to replace it.</p>}</>}
    {step === 6 && <><Upload label="Professional childcare resume (PDF or Word)" accept=".pdf,.doc,.docx" file={resume} change={setResume} required={!savedAttachment("resume")} />{savedAttachment("resume")&&<p className="-mt-3 text-xs text-slate-500">Already on file: {savedAttachment("resume")?.name}. Choose a new file only if you want to replace it.</p>}</>}
   </div>{step === 4 && <div className="space-y-8"><RepeatedGroup title="Reference" fields={REFERENCE_FIELDS} rows={references} change={setReferences} minimum={2} /><RepeatedGroup title="Work history" fields={WORK_FIELDS} rows={workHistory} change={setWorkHistory} minimum={1} /></div>}{step === 5 && values.speaksOtherLanguages === "Yes" && <div className="mt-8"><RepeatedGroup title="Language" fields={LANGUAGE_FIELDS} rows={languages} change={setLanguages} minimum={1} /></div>}</section>)}
   <div className="application-actions">{error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}<div className="flex flex-wrap items-center justify-between gap-4"><span className="text-xs text-slate-500">{step === 6 ? "Ready to take the next step?" : "Your answers save as you continue."}</span><div className="flex flex-wrap gap-3">{step > 0 && <button type="button" disabled={loading||savingDraft} onClick={() => { setError(""); setStep(step - 1); }} className="application-secondary">Previous</button>}<button type="button" disabled={loading||savingDraft} onClick={saveAndExit} className="application-secondary">{savingDraft?<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>:"Save and exit"}</button><button type="submit" disabled={loading||savingDraft} className="application-submit">{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{loading ? "Submitting..." : savingDraft?"Saving…": step === 6 ? "Submit Application" : "Continue"}{!loading && !savingDraft && step < 6 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}</button></div></div><p className="mt-4 text-xs text-slate-400">Photo and documents: up to 5 MB per file. If you save and leave before submitting, reselect files when you return.</p></div>
  </form>
 </div>;
}
