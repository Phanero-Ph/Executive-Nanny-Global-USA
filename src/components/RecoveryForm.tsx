"use client";
import Link from "next/link";
import { useState } from "react";
export function RecoveryForm({mode,token="",successHref="/login"}:{mode:"forgot"|"reset"|"verify";token?:string;successHref?:string}) {
 const [loading,setLoading]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();setError("");setLoading(true);const data=new FormData(event.currentTarget);
  try {
   const body=mode==="forgot"?{email:data.get("email")}:mode==="verify"?{token}:{token,password:data.get("password"),confirmPassword:data.get("confirmPassword")};
   const route=mode==="forgot"?"forgot-password":mode==="reset"?"reset-password":"verification";
   const response=await fetch(`/api/auth/${route}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error);setDone(true);
  }catch(err){setError(err instanceof Error?err.message:"Please try again.");}finally{setLoading(false);}
 }
 if(done)return <div role="status"><h2 className="text-xl text-ink-900">{mode==="forgot"?"Check your email":mode==="reset"?"Password updated":"Email verified"}</h2><p className="mt-3 text-sm text-slate-500">{mode==="forgot"?"If an account exists for that address, a password-reset email will be sent. Check your spam folder too.":mode==="reset"?"Sign in with your new password. Previous sessions have been signed out.":"Your email has been verified. Sign in with your email and password to access your account."}</p><Link href={mode==="verify"?successHref:"/login"} className="application-submit mt-6">{mode==="verify"&&successHref!=="/login"?"Continue to dashboard":"Back to sign in"}</Link></div>;
 return <form onSubmit={submit} className="space-y-5">{mode==="forgot"?<label className="block"><span className="application-label">Email address</span><input name="email" type="email" required maxLength={254} autoComplete="email" className="application-input"/></label>:mode==="reset"?<><label className="block"><span className="application-label">New password</span><input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="application-input"/></label><label className="block"><span className="application-label">Confirm password</span><input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="application-input"/></label><p className="text-xs text-slate-500">Use 8–128 characters.</p></>:<p className="text-sm text-slate-500">Confirm that this email address belongs to you.</p>}{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading||mode!=="forgot"&&!token} className="application-submit w-full">{loading?"Please wait...":mode==="forgot"?"Send reset link":mode==="reset"?"Update password":"Verify email"}</button>{mode!=="forgot"&&!token&&<p className="text-sm text-red-700">Open the link from your email to continue.</p>}<Link href="/login" className="block text-center text-sm text-slate-500">Back to sign in</Link></form>;
}
export function VerificationControl({verified}:{verified:boolean}) {
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function resend(){setBusy(true);try{const response=await fetch("/api/auth/verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"resend"})});if(!response.ok)throw Error();setMessage("Verification requested. Check your email; resends may be limited.");}catch{setMessage("Could not request verification. Please try again.");}finally{setBusy(false);}}
 return <div className="rounded-lg bg-cream-50 p-3 text-xs text-slate-500">{verified?<p className="text-teal-brand">Email verified</p>:<><p>Email verification pending.</p><button type="button" disabled={busy} onClick={resend} className="mt-2 text-ink-900 underline">{busy?"Requesting...":"Resend verification email"}</button></>}{message&&<p role="status" className="mt-2">{message}</p>}</div>;
}
