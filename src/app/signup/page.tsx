import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/ui";
import { Reveal } from "@/components/ui-client";
import { SignupForm } from "@/components/forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create Your Account | Executive Global Nanny",
  description: "Create an Executive Global Nanny account to request childcare or apply for nanny opportunities.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({searchParams}:{searchParams:Promise<{role?:string}>}) {
  const {role:requestedRole}=await searchParams;
  const role=requestedRole==="nanny"?"nanny":"family";
  const currentUser=await getCurrentUser({allowUnverified:true});
  return (
    <>
      <PageHero
        eyebrow="Join EGN"
        title={role==="nanny"?"Create your nanny account":"Create your free family account"}
        sub={role==="nanny"?"Start with your name, email, and password. After verifying your email and signing in, you’ll complete the full application from your dashboard.":"Set up your account, verify your email, then choose the care service your family needs."}
      />
      <section className="bg-cream-100 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal delay={100} className="order-2 lg:order-1">
            <div className="flex h-full flex-col justify-center rounded-3xl bg-ink-900 p-7 text-white shadow-card sm:p-9">
              <h2 className="text-xl font-extrabold">Why create an account?</h2>
              <ul className="mt-5 space-y-4">
                {[
                  ...(role==="nanny"?[
                    { icon: Zap, title: "Quick account setup", text: "Create your account with just your name, email, and password." },
                    { icon: HeartHandshake, title: "Finish when you’re signed in", text: "Complete the detailed application from your dashboard and save your progress as you go." },
                    { icon: ShieldCheck, title: "You control submission", text: "The agency receives your application only after you submit the completed form." },
                  ]:[
                    { icon: Zap, title: "Faster requests", text: "Your household details are saved — rebook care in seconds." },
                    { icon: HeartHandshake, title: "Direct recruiter access", text: "Message the team handling your match, anytime." },
                    { icon: ShieldCheck, title: "Secure & private", text: "Your data stays protected under strict access controls." },
                  ]),
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
              <SignupForm role={role} existingAccount={currentUser?{name:currentUser.name,role:currentUser.role}:undefined}/>
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
