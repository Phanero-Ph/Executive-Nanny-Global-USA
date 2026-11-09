"use client";
import { UserRound, Save, Mail, Loader2, Trash2, X } from "lucide-react";
import { useAdminPermissions } from "./AdminPermissions";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AccountPermission = "families.edit" | "nannies.edit";
type DeletePermission = "families.delete" | "nannies.delete";

export function AdminAccountEditor({
  id, name, phone, email, version, variant, permission, deletePermission, returnTo,
}: {
  id: string; name: string; phone: string | null; email: string; version: string;
  variant?: "settings"; permission?: AccountPermission; deletePermission?: DeletePermission; returnTo?: string;
}) {
  const { can } = useAdminPermissions();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const canEdit = !!permission && can(permission);
  const canDelete = !!deletePermission && can(deletePermission) && !!returnTo;

  useEffect(() => {
    if (!deleteOpen) return;
    confirmationInputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeleteOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      deleteTriggerRef.current?.focus();
    };
  }, [deleteOpen]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), phone: form.get("phone"), version }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage("Account contact details saved."); router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  async function removeAccount() {
    setBusy(true); setDeleteError("");
    try {
      const response = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation, version }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      router.replace(returnTo!); router.refresh();
    } catch (e) { setDeleteError(e instanceof Error ? e.message : "Could not delete account."); }
    finally { setBusy(false); }
  }

  function openDeleteModal() {
    setConfirmation("");
    setDeleteError("");
    setDeleteOpen(true);
  }

  const editForm = canEdit ? (variant === "settings"
    ? <section className="as-card as-account" id="your-account" aria-labelledby="account-settings-title"><header className="as-card-head"><span className="as-icon"><UserRound size={21} aria-hidden="true"/></span><div><p className="as-eyebrow">YOUR PROFILE</p><h2 id="account-settings-title">Account contact details</h2></div></header><form onSubmit={save} className="as-control-form"><div className="as-card-body"><p className="as-description">Keep your administrator contact information up to date.</p><fieldset disabled={busy} className="as-account-fields"><label><span>Full name</span><input name="name" defaultValue={name} required maxLength={255} autoComplete="name"/></label><label><span>Phone number</span><input name="phone" type="tel" defaultValue={phone || ""} maxLength={50} autoComplete="tel" placeholder="Add a phone number"/></label></fieldset><div className="as-account-email"><Mail size={16} aria-hidden="true"/><div><small>Account email</small><span>{email}</span></div></div><p className="as-fineprint">Updates your contact record. Submitted applications and payment records retain their original details.</p>{message && <p role="status" className="as-feedback">{message}</p>}</div><footer className="as-card-footer"><span>Your administrator profile</span><button disabled={busy} className="as-save">{busy ? <Loader2 size={15} className="as-spin" aria-hidden="true"/> : <Save size={15} aria-hidden="true"/>}{busy ? "Saving…" : "Save contact details"}</button></footer></form></section>
    : <form onSubmit={save} className="dashboard-card space-y-5"><h2>Account contact details</h2><label className="block"><span className="application-label">Full name</span><input className="application-input" name="name" defaultValue={name} required maxLength={255}/></label><label className="block"><span className="application-label">Phone</span><input className="application-input" name="phone" type="tel" defaultValue={phone || ""} maxLength={50}/></label><p className="text-sm break-all text-slate-500">Account email: {email}</p><p className="text-xs leading-6 text-slate-500">Updates this account’s contact record. Submitted applications and payment records retain their original details.</p>{message && <p role="status" className="text-sm">{message}</p>}<button disabled={busy} className="application-submit">{busy ? "Saving…" : "Save contact details"}</button></form>) : null;

  if (variant === "settings") return editForm;
  if (!editForm && !canDelete) return null;
  return <>
    <div className="space-y-4">{editForm}{canDelete && <section className="dashboard-card space-y-3 border border-red-200"><h2 className="text-red-800">Delete account</h2><p className="text-sm leading-6 text-slate-600">Revokes login access and removes personal profile details and uploaded documents. Some financial, placement, and audit history may be retained where needed. Active bookings, memberships, subscriptions, or placements must be resolved first.</p>{message && !canEdit && <p role="status" className="text-sm text-red-800">{message}</p>}<button ref={deleteTriggerRef} type="button" disabled={busy} onClick={openDeleteModal} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"><Trash2 size={16} aria-hidden="true"/>Delete account</button></section>}</div>
    {canDelete && deleteOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-ink-950/65 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setDeleteOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Permanent account action</p><h2 id="delete-account-title" className="mt-2 text-2xl font-bold text-ink-900">Delete this account?</h2></div><button type="button" disabled={busy} onClick={() => setDeleteOpen(false)} aria-label="Close delete confirmation" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={20}/></button></div>
        <p id="delete-account-description" className="mt-4 text-sm leading-6 text-slate-600">This revokes login access and removes personal profile details and uploaded documents. Some financial, placement, and audit history may be retained where needed. You must resolve active bookings, memberships, subscriptions, or placements first.</p>
        <label htmlFor="delete-account-email" className="mt-6 block text-sm font-semibold text-ink-900">Type this account’s email to confirm</label>
        <p className="mt-1 break-all text-sm text-slate-600">{email}</p>
        <input ref={confirmationInputRef} id="delete-account-email" type="email" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="application-input mt-2" placeholder="Enter the account email" disabled={busy}/>
        {deleteError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm leading-5 text-red-800">{deleteError}</p>}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" disabled={busy} onClick={() => setDeleteOpen(false)} className="min-h-11 rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" disabled={busy || confirmation.trim() !== email} onClick={removeAccount} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><Loader2 size={16} className="animate-spin"/>Deleting…</> : <><Trash2 size={16}/>Delete account</>}</button></div>
      </section>
    </div>}
  </>;
}
