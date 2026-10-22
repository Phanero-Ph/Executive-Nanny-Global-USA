import type { Metadata } from "next";
import { RecoveryForm } from "@/components/RecoveryForm";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Set a new password",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function RecoveryPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams;const token=typeof params.token==="string"?params.token:"";
 return <section className="application-page bg-cream-50 px-5 py-16"><div className="mx-auto max-w-md rounded-2xl border border-cream-300 bg-white p-7 sm:p-9"><span className="application-kicker">YOUR EGN ACCOUNT</span><h1 className="mt-4 text-3xl text-ink-900">Set a new password</h1><p className="mb-7 mt-3 text-sm text-slate-500">Choose a new password for your account.</p><RecoveryForm mode="reset" token={token}/></div></section>;
}
