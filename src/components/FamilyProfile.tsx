"use client";
import { VerificationControl } from "@/components/RecoveryForm";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function FamilyProfile({ name, email, phone, role = "family", verified = false }: { name: string; email: string; phone: string | null; role?: "family" | "nanny"; verified?: boolean }) {
 const router = useRouter();
 const [saving, setSaving] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
 async function save(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setSaving(true); setMessage(""); setError("");
  const data = new FormData(event.currentTarget);
  try {
   const response = await fetch(`/api/${role}/profile`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone") }) });
   const result = await response.json(); if (!response.ok) throw new Error(result.error);
   setMessage("Profile saved."); router.refresh();
  } catch (err) { setError(err instanceof Error ? err.message : "Could not save your profile."); } finally { setSaving(false); }
 }
 return <form onSubmit={save} className="space-y-5"><label className="block"><span className="application-label">Full name</span><input name="name" defaultValue={name} required maxLength={255} autoComplete="name" className="application-input" /></label><div><span className="application-label">Email address</span><p className="break-all text-sm text-slate-600">{email}</p><p className="mt-1 text-xs text-slate-400">Your account email stays the same.</p></div><label className="block"><span className="application-label">Phone number</span><input name="phone" defaultValue={phone || ""} maxLength={50} type="tel" autoComplete="tel" className="application-input" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-teal-brand">{message}</p>}<VerificationControl verified={verified}/><button disabled={saving} className="application-submit">{saving ? "Saving..." : "Save profile"}</button></form>;
}
