import Link from "next/link";
import {ArrowUpRight,ShieldCheck} from "lucide-react";
import {feeMoney,feePercent} from "@/lib/fee-format";

type FeeNoticeItem={id:string;rate:number;amount:number|null;salary:number|null};

export function FamilyPlacementFeeNotice({items}:{items:FeeNoticeItem[]}){
 if(!items.length)return null;
 return <aside className="mb-6 overflow-hidden rounded-2xl border border-orange-300 bg-orange-50 shadow-sm" aria-labelledby="placement-fee-notice-title">
  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
   <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700"><ShieldCheck size={21} aria-hidden="true"/></span>
    <div>
     <p className="text-[11px] font-bold uppercase tracking-[.14em] text-orange-800">Action required before placement</p>
     <h2 id="placement-fee-notice-title" className="mt-1 text-lg font-semibold text-ink-900">Your nanny placement fee</h2>
     <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">The placement fee is <strong>{feePercent(items[0].rate)}</strong> of the agreed annual salary. {items[0].amount!==null&&items[0].salary!==null?<>Your current fee is <strong>{feeMoney(items[0].amount)}</strong> ({feeMoney(items[0].salary)} × {feePercent(items[0].rate)}).</>:"The agency will confirm the exact amount after recording your agreed salary."} It must be paid before your nanny starts work. Nanny wages are separate.</p>
     {items.length>1&&<p className="mt-2 text-xs font-medium text-orange-900">{items.length} nanny requests still have an unpaid placement fee.</p>}
    </div>
   </div>
   <Link href="/dashboard/family?view=caregiver" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">View nanny request<ArrowUpRight size={16} aria-hidden="true"/></Link>
  </div>
 </aside>;
}
