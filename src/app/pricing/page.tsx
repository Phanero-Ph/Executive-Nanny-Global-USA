import {getAgencyFees} from "@/lib/agency-fees";
import {feeMoney,feePercent} from "@/lib/fee-format";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck, Info, Sparkles, BadgeCheck } from "lucide-react";
import { PRICING } from "@/data/site";
import { PageHero, SectionHeader, CtaBand, JsonLd } from "@/components/ui";
import { Reveal, FaqAccordion } from "@/components/ui-client";
import { FAQS } from "@/data/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing — Search Fees, Memberships & Nanny Plans",
  description:
    "Babysitter subscriptions from $59/month. Nanny placement requires separate search and placement fees, with no family subscription required.",
  alternates: { canonical: "/pricing" },
};

export const dynamic="force-dynamic";
export default async function PricingPage() {
  const fees=await getAgencyFees();
  const familySearch=PRICING.familySearch.map(plan=>({...plan,price:plan.name==="Nanny search"?feeMoney(fees.searchCents):plan.name==="Nanny placement"?feePercent(fees.placementRateBps):plan.price}));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "PriceSpecification",
          name: "Nanny search fee",
          price: (fees.searchCents/100).toFixed(2),
          priceCurrency: "USD",
        }}
      />
      <PageHero
        eyebrow="Transparent Pricing"
        title="Honest pricing, confirmed in writing"
        sub="Every fee is confirmed before payment. No hidden charges, no surprises — just exceptional care."
      />

      {/* Family search fees */}
      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="For Families"
              title={<>Placement search fees</>}
              sub="Choose a babysitter subscription or pay per nanny request. Nanny and babysitter wages are separate from company fees."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {familySearch.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 90}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5",
                    plan.featured
                      ? "border-ink-900 bg-ink-900 text-white shadow-card-lg"
                      : "border-cream-300 bg-white shadow-card",
                  )}
                >
                  {plan.featured && (
                    <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ember-500 px-4 py-1.5 text-xs font-extrabold tracking-wide whitespace-nowrap text-white uppercase shadow-ember">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Most Popular
                    </span>
                  )}
                  <h3 className={cn("text-lg font-extrabold", plan.featured ? "text-ember-400" : "text-ember-600")}>{plan.name}</h3>
                  <p className="mt-2">
                    <span className={cn("text-5xl font-extrabold tracking-tight", plan.featured ? "text-white" : "text-ink-900")}>
                      {plan.price}
                    </span>{" "}
                    <span className={cn("text-sm font-semibold", plan.featured ? "text-teal-mist/80" : "text-slate-500")}>{plan.unit}</span>
                  </p>
                  <p className={cn("mt-2 text-[15px]", plan.featured ? "text-teal-mist/85" : "text-slate-600")}>{plan.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className={cn("flex items-start gap-2.5 text-[15px] font-medium", plan.featured ? "text-white/90" : "text-slate-700")}>
                        <span className={cn("mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full p-1", plan.featured ? "bg-ember-500/25" : "bg-ember-500/15")}>
                          <Check className="h-3.5 w-3.5 text-ember-500" aria-hidden="true" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/find-nanny"
                    className={cn(
                      "mt-8 rounded-xl px-6 py-3.5 text-center font-bold transition",
                      plan.featured
                        ? "bg-ember-500 text-white shadow-ember hover:bg-ember-600"
                        : "border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white",
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-8 flex gap-3 rounded-2xl border border-teal-border bg-teal-pale p-5 text-[15px] leading-relaxed text-slate-700">
              <Info className="h-5 w-5 shrink-0 text-ink-900" aria-hidden="true" />
              <p>
                <strong className="text-ink-900">Two placement options:</strong> Babysitter search and placement company fees are included in your subscription. For nanny requests, pay {feeMoney(fees.searchCents)} to start searching and {feePercent(fees.placementRateBps)} of the agreed annual salary after agency selection, before work starts. No subscription is needed for nanny placement.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Memberships */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="Babysitter Subscriptions"
              title={<>Your babysitter search, one monthly plan</>}
              sub="Each paid month includes 3, 5, 8 or unlimited babysitter search submissions, with company search and placement fees included. Wages are separate."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PRICING.memberships.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 90}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-3xl border-2 p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-lg",
                    plan.featured ? "border-ember-500 bg-cream-100" : "border-cream-300 bg-white",
                  )}
                >
                  {plan.featured && (
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-ember-500 px-3.5 py-1 text-xs font-extrabold tracking-wide text-white uppercase">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Best Value
                    </span>
                  )}
                  <h3 className="text-lg font-extrabold text-ink-900">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-5xl font-extrabold tracking-tight text-ink-900">{plan.price}</span>
                    <span className="text-sm font-semibold text-slate-500">{plan.unit}</span>
                  </p>
                  <p className="mt-2 text-[15px] text-slate-600">{plan.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[15px] font-medium text-slate-700">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard/family?view=membership"
                    className={cn(
                      "mt-8 rounded-xl px-6 py-3.5 text-center font-bold transition",
                      plan.featured ? "bg-ember-500 text-white shadow-ember hover:bg-ember-600" : "bg-ink-900 text-white hover:bg-ink-800",
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nanny subscription */}
      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="For Nannies"
              title={<>Nanny subscription</>}
              sub="Approved nannies hold an active subscription that keeps profiles visible for matching and unlocks the full Training Academy."
            />
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10 grid overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-card md:grid-cols-2">
              <div className="bg-ink-900 p-8 text-white sm:p-10">
                <h3 className="text-xl font-extrabold">Simple, flat pricing</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-5">
                    <div>
                      <p className="font-extrabold">Monthly</p>
                      <p className="text-sm text-teal-mist/75">Cancel anytime</p>
                    </div>
                    <p className="text-3xl font-extrabold text-ember-400">
                      {PRICING.caregiver.monthly.price}
                      <span className="text-sm font-semibold text-teal-mist/75">{PRICING.caregiver.monthly.unit}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-ember-500/50 bg-ember-500/10 p-5">
                    <div>
                      <p className="font-extrabold">Yearly</p>
                      <p className="text-sm text-ember-300">{PRICING.caregiver.yearly.note}</p>
                    </div>
                    <p className="text-3xl font-extrabold text-ember-400">
                      {PRICING.caregiver.yearly.price}
                      <span className="text-sm font-semibold text-teal-mist/75">{PRICING.caregiver.yearly.unit}</span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/apply"
                  className="mt-6 block rounded-xl bg-ember-500 px-6 py-3.5 text-center font-bold text-white shadow-ember transition hover:bg-ember-600"
                >
                  Apply as a Nanny
                </Link>
              </div>
              <div className="p-8 sm:p-10">
                <h3 className="text-xl font-extrabold text-ink-900">Every plan includes</h3>
                <ul className="mt-5 space-y-3.5">
                  {PRICING.caregiver.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] font-medium text-slate-700">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-pale">
                        <Check className="h-3.5 w-3.5 text-teal-brand" aria-hidden="true" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-2xl bg-cream-100 p-4 text-sm leading-relaxed text-slate-600">
                  Matching eligibility pauses automatically if a subscription lapses — protecting families from inactive
                  profiles and keeping the network genuinely engaged.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Guarantee + FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-ink-900 px-6 py-10 text-center sm:px-12">
              <ShieldCheck className="h-10 w-10 text-ember-400" aria-hidden="true" />
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Backed by the 90-day guarantee</h2>
              <p className="max-w-2xl text-teal-mist/85">
                If your placement isn&apos;t right within 90 days, we rematch at no additional placement fee. That&apos;s
                how confident we are in our vetting.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-12">
              <SectionHeader eyebrow="Pricing Questions" title={<>Questions, answered</>} />
              <div className="mt-8">
                <FaqAccordion faqs={FAQS.filter((f) => f.category === "pricing")} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="bg-white pb-20">
        <CtaBand title="Ready when you are" sub="Start with a free consultation — we'll confirm exact pricing in writing before anything else." />
      </div>
    </>
  );
}
