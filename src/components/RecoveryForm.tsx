"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";

type RecoveryMode = "forgot" | "reset" | "verify";

export function RecoveryForm({ mode, token = "", successHref = "/login" }: { mode: RecoveryMode; token?: string; successHref?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = data.get("password");
    const confirmPassword = data.get("confirmPassword");
    if (mode === "reset" && password !== confirmPassword) {
      setError("Those passwords do not match. Check them and try again.");
      return;
    }

    setLoading(true);
    try {
      const body = mode === "forgot"
        ? { email: data.get("email") }
        : mode === "verify"
          ? { token }
          : { token, password, confirmPassword };
      const route = mode === "forgot" ? "forgot-password" : mode === "reset" ? "reset-password" : "verification";
      const response = await fetch(`/api/auth/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const title = mode === "forgot" ? "Check your email" : mode === "reset" ? "Password updated" : "Email verified";
    const copy = mode === "forgot"
      ? "If an account exists for that address, a password-reset email will be sent. The link expires after 30 minutes. Check your spam or junk folder too."
      : mode === "reset"
        ? "Your password has been changed and previous sessions have been signed out. Sign in with your new password."
        : "Your email has been verified. Sign in with your email and password to access your account.";
    return (
      <div role="status" aria-live="polite" className="rounded-2xl border border-teal-border bg-teal-pale p-5 sm:p-6">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-brand"><MailCheck size={22} aria-hidden="true" /></span>
        <h2 className="mt-4 text-xl font-semibold text-ink-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
        <Link href={mode === "verify" ? successHref : "/login"} className="application-submit mt-5 w-full">
          {mode === "verify" && successHref !== "/login" ? "Continue to dashboard" : "Back to sign in"}<ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const fieldClass = "application-input w-full";
  return (
    <form onSubmit={submit} className="space-y-5" aria-busy={loading}>
      {mode === "forgot" ? (
        <label htmlFor="recovery-email" className="block">
          <span className="application-label">Email address</span>
          <input id="recovery-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" className={fieldClass} />
        </label>
      ) : mode === "reset" ? (
        <>
          <div>
            <label htmlFor="recovery-password" className="application-label">New password</label>
            <div className="relative">
              <input id="recovery-password" name="password" type={showPasswords ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="new-password" className={`${fieldClass} pr-12`} />
              <button type="button" onClick={() => setShowPasswords((visible) => !visible)} className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-teal-brand" aria-label={showPasswords ? "Hide passwords" : "Show passwords"} aria-pressed={showPasswords} aria-controls="recovery-password recovery-confirm-password">
                {showPasswords ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <label htmlFor="recovery-confirm-password" className="block">
            <span className="application-label">Confirm new password</span>
            <input id="recovery-confirm-password" name="confirmPassword" type={showPasswords ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="new-password" className={fieldClass} />
          </label>
          <p className="-mt-2 text-xs leading-5 text-slate-500">Use 8–128 characters. You can reveal both fields to check what you entered.</p>
        </>
      ) : (
        <p className="text-sm leading-6 text-slate-600">Confirm that this email address belongs to you.</p>
      )}

      {error && <p role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700">{error}</p>}
      <button type="submit" disabled={loading || (mode !== "forgot" && !token)} className="application-submit w-full">
        {loading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
        {loading ? "Please wait…" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Verify email"}
        {!loading && <ArrowRight size={16} aria-hidden="true" />}
      </button>
      {mode !== "forgot" && !token && <p role="alert" className="text-sm text-red-700">This link is missing or invalid. Request a new password-reset email.</p>}
      <Link href="/login" className="block min-h-11 py-3 text-center text-sm font-medium text-slate-500 hover:text-ink-900">Back to sign in</Link>
    </form>
  );
}

export function VerificationControl({ verified, email }: { verified: boolean; email?: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resend", email }) });
      if (!response.ok) throw Error();
      setMessage("Verification requested. Check your email; resends may be limited.");
    } catch {
      setMessage("Could not request verification. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl bg-cream-50 p-4 text-sm text-slate-600">
      {verified ? <p className="text-teal-brand">Email verified</p> : <><p>Email verification pending.</p><button type="button" disabled={busy} onClick={resend} className="mt-3 min-h-11 rounded-lg px-2 font-medium text-ink-900 underline underline-offset-4">{busy ? "Requesting…" : "Resend verification email"}</button></>}
      {message && <p role="status" className="mt-2" aria-live="polite">{message}</p>}
    </div>
  );
}
