"use client";

import {RegistrationSuccess} from "./RegistrationSuccess";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send, ArrowRight, ArrowLeft, PartyPopper, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/data/site";

/* ------------------------------ Shared primitives ----------------------------- */

const inputCls =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-[15px] font-medium text-ink-900 placeholder:font-normal placeholder:text-slate-400 outline-none transition focus:border-ink-900 focus:ring-2 focus:ring-ink-900/15";

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-900">
        {label} {required && <span className="text-ember-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
      {message}
    </div>
  );
}

function SuccessPanel({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-teal-border bg-teal-pale px-6 py-10 text-center sm:px-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-900">
        <PartyPopper className="h-7 w-7 text-ember-400" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-slate-600">{body}</p>
      {cta && <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{cta}</div>}
    </div>
  );
}

async function postJson(url: string, data: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
  return json;
}

/* --------------------------------- Newsletter --------------------------------- */

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      await postJson("/api/newsletter", { email: email.trim() });
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 font-semibold text-white">
        <CheckCircle2 className="h-5 w-5 text-ember-400" aria-hidden="true" />
        You&apos;re subscribed — welcome to the family!
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          className="w-full flex-1 rounded-xl border border-white/20 bg-white px-4 py-3 text-[15px] font-medium text-ink-900 placeholder:text-slate-400 outline-none transition focus:border-ember-400 focus:ring-2 focus:ring-ember-400/40"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-6 py-3 font-bold text-white shadow-ember transition hover:bg-ember-600 disabled:opacity-70"
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Subscribe
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-sm font-semibold text-ember-300">Couldn&apos;t subscribe — please try again.</p>}
    </form>
  );
}

/* ---------------------------------- Contact ----------------------------------- */

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await postJson("/api/contact", Object.fromEntries(fd.entries()));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SuccessPanel
        title="Message received!"
        body="Thanks for reaching out — a member of our Branchburg team will respond within one business day."
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <input name="name" required placeholder="Jane Smith" className={inputCls} autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required placeholder="jane@email.com" className={inputCls} autoComplete="email" />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone">
          <input name="phone" type="tel" placeholder="(908) 555-1234" className={inputCls} autoComplete="tel" />
        </Field>
        <Field label="I'm contacting about" required>
          <select name="subject" required className={inputCls} defaultValue="Finding a nanny">
            <option>Finding a nanny</option>
            <option>Babysitting membership</option>
            <option>Backup care</option>
            <option>Becoming a nanny</option>
            <option>Training academy</option>
            <option>Something else</option>
          </select>
        </Field>
      </div>
      <Field label="Message" required>
        <textarea name="message" required rows={5} placeholder="Tell us how we can help…" className={cn(inputCls, "resize-y")} />
      </Field>
      <FormError message={error} />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ember-500 px-6 py-4 font-bold text-white shadow-ember transition hover:-translate-y-0.5 hover:bg-ember-600 disabled:translate-0 disabled:opacity-70 sm:w-auto"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
        Send Message
      </button>
    </form>
  );
}

/* ------------------------------- Family request ------------------------------ */

export function FamilyRequestForm({ compact = false }: { compact?: boolean }) {
 return <div className={cn("space-y-5",compact&&"text-sm")}><p className="leading-7 text-slate-600">Choose babysitter placement with a monthly subscription, or nanny placement with a separate search fee and salary-based placement fee. Nanny wages are separate.</p><div className="flex flex-wrap gap-3"><Link href="/find-nanny" className="application-submit">Start your care request</Link><Link href="/dashboard/family/new" className="application-secondary">Already have a family account?</Link></div></div>;
}

const NANNY_STEPS = ["Your details", "Experience", "Final details"];

export function NannyApplicationForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const validStep = () => {
    if (step === 0) return data.name?.trim() && data.email?.trim() && data.phone?.trim() && data.city?.trim();
    if (step === 1) return data.experienceYears && data.services;
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      if (validStep()) setStep(step + 1);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await postJson("/api/nanny-applications", data);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SuccessPanel
        title="Application submitted!"
        body="Our recruiting team reviews every application within 2 business days. Watch your inbox for next steps — document review, screening, and your recruiter interview."
        cta={
          <>
            <Link href="/training" className="rounded-xl bg-ink-900 px-6 py-3 font-bold text-white transition hover:bg-ink-800">
              Explore Training
            </Link>
            <Link href="/signup" className="rounded-xl border-2 border-ink-900 px-6 py-2.5 font-bold text-ink-900 transition hover:bg-ink-900 hover:text-white">
              Create Nanny Account
            </Link>
          </>
        }
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Progress */}
      <ol className="flex items-center gap-2 sm:gap-3" aria-label="Application progress">
        {NANNY_STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition",
                i < step && "bg-ink-900 text-white",
                i === step && "bg-ember-500 text-white shadow-ember",
                i > step && "bg-cream-300 text-slate-500",
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm font-bold sm:block", i === step ? "text-ink-900" : "text-slate-400")}>{label}</span>
            {i < NANNY_STEPS.length - 1 && <span className="h-0.5 flex-1 rounded bg-cream-300" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <input value={data.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Maria Garcia" className={inputCls} autoComplete="name" />
          </Field>
          <Field label="Email" required>
            <input type="email" value={data.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="maria@email.com" className={inputCls} autoComplete="email" />
          </Field>
          <Field label="Phone" required>
            <input type="tel" value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="(908) 555-1234" className={inputCls} autoComplete="tel" />
          </Field>
          <Field label="City / Town" required>
            <input value={data.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Somerville, NJ" className={inputCls} autoComplete="address-level2" />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Years of childcare experience" required>
              <select value={data.experienceYears ?? ""} onChange={(e) => set("experienceYears", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option value="1">1 year</option>
                <option value="2">2–3 years</option>
                <option value="4">4–5 years</option>
                <option value="6">6–10 years</option>
                <option value="10">10+ years</option>
              </select>
            </Field>
            <Field label="Services you're interested in" required>
              <select value={data.services ?? ""} onChange={(e) => set("services", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option>Full-time nanny</option>
                <option>Part-time nanny</option>
                <option>Babysitting</option>
                <option>Backup care</option>
                <option>Newborn / overnight care</option>
                <option>Household manager</option>
              </select>
            </Field>
          </div>
          <Field label="Certifications (select all that apply)">
            <div className="grid gap-2.5 rounded-xl border border-cream-300 bg-white p-4 sm:grid-cols-2">
              {["Infant/Child CPR", "First Aid", "Newborn Care Specialist", "Early Childhood Education", "Special Needs Training", "None yet — willing to certify"].map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(data.certifications ?? "").split("|").includes(c)}
                    onChange={(e) => {
                      const list = (data.certifications ?? "").split("|").filter(Boolean);
                      const next = e.target.checked ? [...list, c] : list.filter((x) => x !== c);
                      set("certifications", next.join("|"));
                    }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label="Availability" hint="e.g. Full-time Mon–Fri; evenings & weekends for sitting">
            <input value={data.availability ?? ""} onChange={(e) => set("availability", e.target.value)} placeholder="When can you work?" className={inputCls} />
          </Field>
          <Field label="Tell families about yourself" hint="Experience highlights, ages you love, your caregiving philosophy">
            <textarea value={data.bio ?? ""} onChange={(e) => set("bio", e.target.value)} rows={5} placeholder="Hi! I'm a caring nanny with…" className={cn(inputCls, "resize-y")} />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
            <input type="checkbox" required className="mt-0.5" />
            <span>
              I confirm I&apos;m eligible to work in the US, my information is accurate, and I consent to reference and background
              screening. I understand approved nannies hold an active platform subscription ($19/mo or $190/yr).
            </span>
          </label>
        </div>
      )}

      <FormError message={error} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink-900/20 px-6 py-3.5 font-bold text-ink-900 transition hover:border-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={loading || !validStep()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-8 py-3.5 font-bold text-white shadow-ember transition hover:-translate-y-0.5 hover:bg-ember-600 disabled:translate-0 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : step < 2 ? (
            <>Continue <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
          ) : (
            <>Submit Application <Send className="h-4 w-4" aria-hidden="true" /></>
          )}
        </button>
      </div>
    </form>
  );
}

/* --------------------------------- Auth forms --------------------------------- */

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const json = (await postJson("/api/auth/login", Object.fromEntries(fd.entries()))) as { role?: string; requiresVerification?:boolean };
      router.push(json.requiresVerification?"/verify-email":json.role === "admin" ? "/dashboard/admin" : json.role === "nanny" ? "/dashboard/nanny" : "/dashboard/family");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="login-email" className="application-label">Email address</label>
        <input id="login-email" name="email" type="email" required placeholder="you@example.com" className="application-input" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="login-password" className="application-label">Password</label>
        <div className="relative">
          <input id="login-password" name="password" type={showPassword ? "text" : "password"} required placeholder="Enter your password" className="application-input pr-12" style={{ paddingRight: 48 }} autoComplete="current-password" />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="login-password" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-teal-brand">
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <Link href="/forgot-password" className="block text-right text-xs text-teal-brand hover:underline">Forgot password?</Link>
      <FormError message={error} />
      <button type="submit" disabled={loading} className="application-submit w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} {loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </form>
  );
}

export function SignupForm({ role = "family", existingAccount }: { role?: "family" | "nanny"; existingAccount?: { name: string; role: string } }) {
  const router = useRouter();
  const [registeredRole,setRegisteredRole]=useState<"family"|"nanny">("family");
  const [registeredEmail,setRegisteredEmail]=useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirmPassword,setShowConfirmPassword]=useState(false);

  const logoutAndContinue = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      window.location.href = `/signup?role=${role}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.");
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      if(fd.get("password")!==fd.get("confirmPassword")){
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const json = (await postJson("/api/auth/signup", Object.fromEntries(fd.entries()))) as { role?: string };
      if(json.role==="family"||json.role==="nanny"){setRegisteredRole(json.role);setRegisteredEmail(String(fd.get("email")||"").trim().toLowerCase());return;}
      router.push(json.role === "admin" ? "/dashboard/admin" : json.role === "nanny" ? "/dashboard/nanny" : "/dashboard/family");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      setLoading(false);
    }
  };

  if(registeredEmail)return <RegistrationSuccess role={registeredRole} email={registeredEmail} message={registeredRole==="nanny"?"Your account is set up. Verify your email, sign in to your dashboard, and complete your nanny application there. Your application will reach the agency only after you submit it.":undefined} nannyApplicationSubmitted={false}/>;
  if(existingAccount)return <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm leading-6 text-slate-700"><h2 className="text-lg font-bold text-ink-900">You’re signed in as {existingAccount.role === "family" ? "a family member" : existingAccount.role === "nanny" ? "a nanny" : "an administrator"}.</h2><p>To create a separate {role} account, sign out first. Each email address can belong to one account. If this is already the right account, continue to its dashboard or sign in with another email.</p><div className="flex flex-wrap gap-3"><button type="button" disabled={loading} onClick={logoutAndContinue} className="application-submit">{loading?"Signing out…":"Sign out to continue"}</button><Link className="application-secondary" href={`/dashboard/${existingAccount.role}`}>Go to your dashboard</Link></div><FormError message={error}/></div>;

  return (
    <form onSubmit={submit} className="space-y-5">
      <input type="hidden" name="role" value={role} />
      {role === "nanny" ? <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required><input name="firstName" required placeholder="Jane" className={inputCls} autoComplete="given-name" /></Field>
        <Field label="Last name" required><input name="lastName" required placeholder="Smith" className={inputCls} autoComplete="family-name" /></Field>
      </div> : <Field label="Full name" required>
        <input name="name" required placeholder="Jane Smith" className={inputCls} autoComplete="name" />
      </Field>}
      <div className={`grid gap-5 ${role === "family" ? "sm:grid-cols-2" : ""}`}>
        <Field label="Email" required>
          <input name="email" type="email" required placeholder="you@email.com" className={inputCls} autoComplete="email" />
        </Field>
        {role === "family" && <Field label="Phone">
          <input name="phone" type="tel" placeholder="(908) 555-1234" className={inputCls} autoComplete="tel" />
        </Field>}
      </div>
      <Field label="Password" required hint="At least 8 characters">
        <div className="relative">
          <input id="family-signup-password" name="password" type={showPassword?"text":"password"} required minLength={8} maxLength={128} placeholder="Create a password" className={`${inputCls} pr-12`} autoComplete="new-password" />
          <button type="button" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} aria-controls="family-signup-password" onClick={()=>setShowPassword(value=>!value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-teal-brand">
            {showPassword?<EyeOff className="h-4 w-4" aria-hidden="true"/>:<Eye className="h-4 w-4" aria-hidden="true"/>}
          </button>
        </div>
      </Field>
      <Field label="Confirm password" required>
        <div className="relative">
          <input id="family-signup-confirm-password" name="confirmPassword" type={showConfirmPassword?"text":"password"} required minLength={8} maxLength={128} placeholder="Enter your password again" className={`${inputCls} pr-12`} autoComplete="new-password" />
          <button type="button" aria-label={showConfirmPassword?"Hide confirmation password":"Show confirmation password"} aria-pressed={showConfirmPassword} aria-controls="family-signup-confirm-password" onClick={()=>setShowConfirmPassword(value=>!value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-teal-brand">
            {showConfirmPassword?<EyeOff className="h-4 w-4" aria-hidden="true"/>:<Eye className="h-4 w-4" aria-hidden="true"/>}
          </button>
        </div>
      </Field>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
        <input type="checkbox" required className="mt-0.5" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-bold text-ink-900 underline">Terms</Link> and{" "}
          <Link href="/privacy" className="font-bold text-ink-900 underline">Privacy Policy</Link>.
        </span>
      </label>
      <FormError message={error} />
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ember-500 px-6 py-3.5 font-bold text-white shadow-ember transition hover:bg-ember-600 disabled:opacity-70">
        {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Create Account
      </button>
    </form>
  );
}
