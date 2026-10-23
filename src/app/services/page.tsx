import {getAgencyFees} from "@/lib/agency-fees";
import {feeMoney,feePercent} from "@/lib/fee-format";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { PRICING, SERVICES } from "@/data/site";
import { cn } from "@/lib/utils";
import { PageHero, SectionHeader, CtaBand, ServiceIcon } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "Childcare Services in New Jersey",
  description:
    "Full-time & part-time nanny placement, babysitter subscriptions, backup care, newborn & overnight care, and household managers — all across New Jersey.",
  alternates: { canonical: "/services" },
};

export const dynamic="force-dynamic";
export default async function ServicesPage() {
  const fees=await getAgencyFees();
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="Complete childcare, one trusted agency"
        sub="Every service is delivered by vetted, CPR-certified caregivers and backed by a dedicated Branchburg-based team."
      />

      <section id="babysitting-memberships" aria-labelledby="membership-heading" className="scroll-mt-20 bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-semibold tracking-wider text-ember-600 uppercase">Monthly subscriptions</span>
              <h2 id="membership-heading" className="mt-3 text-3xl text-ink-900 sm:text-4xl">Babysitter subscriptions</h2>
              <p className="mt-4 text-lg text-slate-600">Choose 3, 5, 8 or unlimited babysitter search submissions per paid month. Company search and placement fees are included; caregiver wages are separate.</p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PRICING.memberships.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 70}>
                <article className={cn("relative flex h-full flex-col rounded-3xl border-2 p-7 shadow-card", plan.featured ? "border-ember-500 bg-cream-200" : "border-cream-300 bg-white")}>
                  {plan.featured && <span className="absolute -top-3 left-6 rounded-full bg-ember-500 px-3 py-1 text-xs font-semibold text-white">Most Popular</span>}
                  <h3 className="text-2xl text-ink-900">{plan.name}</h3>
                  <p className="mt-2 text-sm font-medium text-slate-600">{plan.blurb}</p>
                  <p className="mt-6 text-ink-900"><span className="text-4xl font-semibold">{plan.price}</span><span className="ml-1 text-sm text-slate-500">{plan.unit}</span></p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-brand" aria-hidden="true" />{feature}</li>
                    ))}
                  </ul>
                  <Link href="/dashboard/family?view=membership" aria-label={`${plan.cta} babysitter subscription`} className={cn("mt-7 block rounded-xl px-5 py-3 text-center text-sm font-semibold text-white transition", plan.featured ? "bg-ember-500 shadow-ember hover:bg-ember-600" : "bg-ink-900 hover:bg-ink-800")}>{plan.cta}</Link>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-7 text-center text-sm text-slate-600">Subscriptions cover babysitter search submissions and company placement fees. Nanny placement needs no subscription: {feeMoney(fees.searchCents)} search fee and {feePercent(fees.placementRateBps)} of the agreed annual salary before work starts. Wages are separate.</p>
        </div>
      </section>

      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          {SERVICES.map((service, i) => (
            <Reveal key={service.slug}>
              <article
                className={`grid overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-card lg:grid-cols-2 ${
                  i % 2 === 1 ? "" : ""
                }`}
              >
                <div className={`relative min-h-64 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    loading="lazy"
                    className="object-cover"
                  />
                  <span className="absolute top-5 left-5 rounded-full bg-ink-900/90 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
                    {service.startingAt}
                  </span>
                </div>
                <div className={`p-8 sm:p-10 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-ink-900 p-3 text-ember-400">
                    <ServiceIcon name={service.icon} className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    {service.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-slate-600">{service.longDescription[0]}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {service.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-semibold text-ink-900">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/services/${service.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ember-500 px-6 py-3 font-bold text-white shadow-ember transition hover:-translate-y-0.5 hover:bg-ember-600"
                  >
                    Explore {service.title} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-3xl border border-teal-border bg-teal-pale px-6 py-10 text-center sm:px-12">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900">
                <ShieldCheck className="h-7 w-7 text-ember-400" aria-hidden="true" />
              </span>
              <SectionHeader
                eyebrow="Our Promise"
                title={<>Every placement is guaranteed</>}
                sub="Full-time and part-time placements include a 90-day replacement guarantee and structured 30/60/90-day check-ins. If the match isn't right, we rematch at no additional placement fee."
              />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="bg-white pb-20">
        <CtaBand />
      </div>
    </>
  );
}
