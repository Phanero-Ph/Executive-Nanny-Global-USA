"use client";

import {useState,useSyncExternalStore} from "react";

import {useRouter} from "next/navigation";

import {annualPlacementFee,feeMoney,feePercent,parseAnnualSalary} from "@/lib/fee-format";

const subscribe=()=>()=>{};
const getHydratedSnapshot=()=>true;
const getServerSnapshot=()=>false;
export function AdminPlacementQuote({requestId,rate,revision,salary,matchId,locked,candidates}:{requestId:string;rate:number;revision:number;salary:number|null;matchId:string|null;locked:boolean;candidates:{id:string;name:string}[]}){

 const ready=useSyncExternalStore(subscribe,getHydratedSnapshot,getServerSnapshot);
 const router=useRouter(),[annualSalary,setSalary]=useState(salary==null?"":(salary/100).toFixed(2)),[candidate,setCandidate]=useState(matchId??""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);

 const cents=parseAnnualSalary(annualSalary),amount=cents===null?null:annualPlacementFee(cents,rate);

 async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");setSaved(false);try{const response=await fetch("/api/admin/placement-fees",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId,matchId:candidate,annualSalary,revision})});const data=await response.json();if(!response.ok)throw Error(data.error);setSaved(true);router.refresh();}catch(e){setError(e instanceof Error?e.message:"Unable to save quote.");}finally{setBusy(false);}}

 return <form onSubmit={save} className="m-5 rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm sm:m-6 sm:p-6"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white">2</span><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-orange-700">Admin action · after shortlisting</p><h3 className="mt-1 text-lg font-semibold text-ink-900">Enter the agreed annual salary</h3><p className="mt-2 text-sm leading-6 text-slate-600">Confirm the nanny’s annual salary agreed with the family. We’ll calculate the placement fee automatically; the family pays this fee before work begins. Nanny wages are paid separately.</p></div></div><fieldset disabled={!ready||busy||locked} className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="application-label">Selected nanny *</span><select className="application-input" required value={candidate} onChange={e=>setCandidate(e.target.value)}><option value="">Choose from this shortlist</option>{candidates.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label><span className="application-label">Agreed annual salary (USD) *</span><input className="application-input" type="number" required min="0.01" max="999999.99" step="0.01" placeholder="e.g. 52,000" value={annualSalary} onChange={e=>setSalary(e.target.value)}/></label></fieldset><div className="mt-5 rounded-xl border border-orange-200 bg-white p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Automatic placement fee calculation</p><p className="mt-2 text-lg font-semibold text-ink-900">{amount===null?`Annual salary × ${feePercent(rate)}`:`${feeMoney(cents!)} × ${feePercent(rate)} = ${feeMoney(amount)}`}</p></div>{locked?<p className="mt-3 text-sm text-slate-600">This invoice is already issued or paid. Its salary, selected nanny and fee are locked.</p>:<><p className="mt-3 text-xs leading-6 text-slate-500">Publishing sends the fee to the family for payment and moves this request to Placement fee due. The placement rate was saved when the request was created.</p><button className="application-submit mt-4" disabled={!ready||busy||!candidates.length||amount===null||amount<50}>{busy?"Publishing…":"Calculate & publish placement fee"}</button>{!candidates.length&&<p className="mt-2 text-sm font-medium text-orange-800">Shortlist an approved nanny above before entering the salary.</p>}</>}{error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{saved&&<p role="status" className="mt-3 text-sm text-teal-brand">Placement quote published. The family can now pay.</p>}</form>;

}
