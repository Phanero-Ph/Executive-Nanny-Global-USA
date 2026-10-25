import type {Metadata} from "next";
import Link from "next/link";
import {MailCheck} from "lucide-react";
import {RecoveryForm,VerificationControl} from "@/components/RecoveryForm";
import {VerificationSignOut} from "@/components/VerificationSignOut";
import {getCurrentUser} from "@/lib/auth";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Verify your email",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function VerificationPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams,token=typeof params.token==="string"?params.token:"",user=await getCurrentUser({allowUnverified:true});
 return <section className="application-page bg-cream-50 px-5 py-10"><div className="mx-auto max-w-md rounded-2xl border border-cream-300 bg-white p-7 sm:p-9"><span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-pale text-teal-brand"><MailCheck size={24}/></span><span className="application-kicker block">YOUR EGN ACCOUNT</span><h1 className="mt-4 text-3xl text-ink-900">{user?.emailVerifiedAt&&!token?"Your email is verified":"Verify your email"}</h1>{token?<><p className="mb-7 mt-3 text-sm leading-7 text-slate-500">Confirm your email address to complete your account setup.</p><RecoveryForm mode="verify" token={token} successHref="/login"/></>:user?.emailVerifiedAt?<><p className="mt-4 text-sm leading-7 text-slate-500">Your email is verified. Sign in with your email and password to access your dashboard.</p><Link href="/login" className="application-submit mt-6 w-full">Sign in</Link></>:user?<><p className="mt-4 text-sm leading-7 text-slate-500">We sent a verification link to <strong className="break-words text-ink-900">{user.email}</strong>. Open that email and click the link to verify your account. Check your spam or junk folder if you don’t see it.</p><VerificationControl verified={false}/><Link href="/login" className="application-submit mt-6 w-full">Sign in after verifying</Link><VerificationSignOut/></>:<><p className="mt-4 text-sm leading-7 text-slate-500">Open the verification link sent to your registered email address. Sign in if you need to request a new email.</p><Link href="/login" className="application-submit mt-6 w-full">Sign in to resend verification</Link></>}</div></section>;
}
