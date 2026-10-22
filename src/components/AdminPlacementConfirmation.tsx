"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {CalendarDays,CheckCircle2,ShieldCheck} from "lucide-react";

type PlacementCandidate={id:string;name:string;revision:number;placementStart:string|null;sharedNote:string|null};

export function AdminPlacementConfirmation({candidates,requiredMatchId,locked,canManage=true}:{candidates:PlacementCandidate[];requiredMatchId?:string|null;locked:boolean;canManage?:boolean}){
 const router=useRouter();
 const available=requiredMatchId?candidates.filter(candidate=>candidate.id===requiredMatchId):candidates;
 const [candidateId,setCandidateId]=useState(available.length===1?available[0].id:"");
 const selected=available.find(candidate=>candidate.id===candidateId);
 const [startDate,setStartDate]=useState(selected?.placementStart??"");
 const [note,setNote]=useState(selected?.sharedNote??"");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState(false);

 async function confirm(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!selected)return;
  setBusy(true);setError("");setSaved(false);
  try{
   const response=await fetch("/api/admin/matches",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected.id,revision:selected.revision,status:"placed",placementStart:startDate,sharedNote:note})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error);
   setSaved(true);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not confirm placement.");}
  finally{setBusy(false);}
 }

 if(locked)return <div className="rounded-2xl border border-teal-border bg-teal-pale p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-teal-brand"><CheckCircle2 size={21}/></span><div><h3 className="text-base font-semibold text-ink-900">Placement confirmed</h3><p className="mt-1 text-sm leading-6 text-slate-600">The family, nanny and agency dashboards now show this placement as complete.</p></div></div></div>;

 if(!canManage)return <div className="rounded-xl border border-cream-300 bg-white p-5"><p className="font-semibold text-ink-900">Matching management permission required</p><p className="mt-2 text-sm leading-6 text-slate-600">Your administrator access allows you to view this workflow, but not confirm placements. Contact a super administrator to update your permissions.</p></div>;

 if(!available.length)return <div className="rounded-xl border border-cream-300 bg-cream-50 p-5"><p className="font-semibold text-ink-900">No eligible shortlist is ready for placement</p><p className="mt-2 text-sm leading-6 text-slate-600">Shortlist an approved nanny first. For Request a Nanny, publish the salary-based placement fee and wait for the family’s payment before continuing.</p></div>;

 return <form onSubmit={confirm} className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-pale text-teal-brand"><ShieldCheck size={20}/></span><div><h3 className="text-lg font-semibold text-ink-900">Confirm the nanny’s placement</h3><p className="mt-1 text-sm leading-6 text-slate-600">Confirm only after all request requirements are complete. This updates the family, nanny and agency records.</p></div></div>
  <div className="grid gap-4 sm:grid-cols-2">
   <label><span className="application-label">Nanny to place *</span><select required value={candidateId} onChange={event=>{const next=available.find(candidate=>candidate.id===event.target.value);setCandidateId(event.target.value);setStartDate(next?.placementStart??"");setNote(next?.sharedNote??"");}} className="application-input"><option value="">Choose a shortlisted nanny</option>{available.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
   <label><span className="application-label">Agreed placement start date *</span><span className="relative block"><CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input required type="date" value={startDate} onChange={event=>setStartDate(event.target.value)} className="application-input !pl-10"/></span></label>
  </div>
  <label className="mt-4 block"><span className="application-label">Note for the family and nanny <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={3} maxLength={5000} value={note} onChange={event=>setNote(event.target.value)} placeholder="Add any confirmed start details they should both know." className="application-input"/></label>
  {error&&<p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  {saved&&<p role="status" className="mt-4 text-sm font-medium text-teal-brand">Placement confirmed successfully.</p>}
  <button disabled={busy||!selected} className="application-submit mt-5">{busy?"Confirming placement…":"Confirm placement"}</button>
 </form>;
}
