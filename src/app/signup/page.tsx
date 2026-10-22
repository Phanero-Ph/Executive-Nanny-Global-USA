import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/ui";
import { Reveal } from "@/components/ui-client";
import { SignupForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Create Your Family Account",
  description: "Create a free Executive Global Nanny family account to request childcare and manage your services.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <>
      <PageHero
        eyebrow="Join EGN"
        title="Create your free family account"
        sub="Set up your account, verify your email, then choose the care service your family needs."
      />
      <section className="bg-cream-100 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal delay={100} className="order-2 lg:order-1">
            <div className="flex h-full flex-col justify-center rounded-3xl bg-ink-900 p-7 text-white shadow-card sm:p-9">
              <h2 className="text-xl font-extrabold">Why create an account?</h2>
              <ul className="mt-5 space-y-4">
                {[
                  { icon: Zap, title: "Faster requests", text: "Your household details are saved — rebook care in seconds." },
                  { icon: HeartHandshake, title: "Direct recruiter access", text: "Message the team handling your match, anytime." },
                  { icon: ShieldCheck, title: "Secure & private", text: "Your data stays protected under strict access controls." },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-500/20">
                      <item.icon className="h-4 w-4 text-ember-400" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-sm text-teal-mist/80">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <div className="rounded-3xl border border-cream-300 bg-white p-7 shadow-card sm:p-9">
              <SignupForm />
              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-ember-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
