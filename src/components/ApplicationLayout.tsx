import { PublicImage as Image } from "@/components/PublicImage";
import Link from "next/link";
import { ArrowUpRight, Check, Phone, ShieldCheck } from "lucide-react";
import { SITE, IMAGES } from "@/data/site";

export function ApplicationLayout({ kind, children }: { kind: "family" | "nanny"; children: React.ReactNode }) {
 const family = kind === "family";
 const benefits = family ? ["Carefully screened nannies and babysitters", "Matching around your family's needs", "Personal support throughout your search"] : ["Flexible opportunities that fit your life", "Training and professional development", "A team that supports your next step"];
 return <div className="application-page bg-cream-50">
  <header className="mx-auto max-w-7xl px-5 pb-9 pt-12 sm:px-8 sm:pb-12 sm:pt-16">
   <div className="flex flex-wrap items-center justify-between gap-4"><span className="application-kicker">{family ? "FOR FAMILIES" : "FOR NANNIES"}</span><Link href="/login" className="text-sm text-slate-500 transition hover:text-ink-900">Already a member? <span className="font-semibold text-ink-900">Log in <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden="true" /></span></Link></div>
   <h1 className="mt-5 max-w-3xl text-4xl text-ink-900 sm:text-5xl lg:text-[56px]">{family ? <>Great care starts with<br className="hidden sm:block" /> the right connection.</> : <>Your next chapter<br className="hidden sm:block" /> in childcare starts here.</>}</h1>
   <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{family ? "Tell us about your family. We'll help you find a nanny who fits your home, your routine, and the moments that matter." : "Bring your experience, your passion, and your personality. Let's find the right opportunity for you."}</p>
  </header>
  <div className="mx-auto grid max-w-7xl items-start gap-7 px-5 pb-16 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-9 lg:pb-24">
   <aside className="order-2 space-y-6 lg:order-1 lg:sticky lg:top-28">
    <div className="overflow-hidden rounded-2xl bg-ink-900 text-white">
     <div className="relative hidden h-44 lg:block"><Image src={IMAGES.rockingHorse} alt="A nanny spending time with a child" fill sizes="260px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent" /></div>
     <div className="p-6"><span className="text-xs font-semibold tracking-widest text-ember-400">{family ? "CARE YOU CAN TRUST" : "GROW WITH US"}</span><h2 className="mt-3 text-2xl">{family ? "A personal approach to finding your nanny." : "More than a placement. A partnership."}</h2><ul className="mt-6 space-y-4">{benefits.map(benefit => <li key={benefit} className="flex gap-3 text-sm leading-6 text-teal-mist/85"><Check className="mt-1 h-4 w-4 shrink-0 text-ember-400" aria-hidden="true" />{benefit}</li>)}</ul></div>
    </div>
    <div className="px-1"><div className="flex items-center gap-2 text-sm font-semibold text-ink-900"><ShieldCheck className="h-4 w-4 text-teal-brand" aria-hidden="true" />{family ? "Here to guide you" : "What happens next?"}</div><p className="mt-2 text-sm leading-6 text-slate-500">{family ? "Our team will get in touch to understand your needs and walk you through your search." : "Our team reviews your application and contacts you within 3–5 business days with the next steps."}</p></div>
    <div className="border-t border-cream-300 px-1 pt-5"><p className="text-xs text-slate-500">Need a hand with your application?</p><a href={SITE.phoneHref} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-ink-900"><Phone className="h-4 w-4 text-ember-600" aria-hidden="true" />{SITE.phone}</a><p className="mt-2 text-xs text-slate-500">{SITE.hours}</p></div>
   </aside>
   <section className="application-card order-1 min-w-0 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-[0_16px_60px_-30px_rgba(10,61,74,0.2)] lg:order-2">
    {children}
   </section>
  </div>
 </div>;
}
