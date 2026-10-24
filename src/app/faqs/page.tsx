import type { Metadata } from "next";
import { FAQS, FAQ_CATEGORIES, SITE } from "@/data/site";
import { PageHero, SectionHeader, CtaBand, JsonLd } from "@/components/ui";
import { Reveal, FaqAccordion } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "FAQs — Nanny Services, Pricing & Safety Questions",
  description:
    "Answers about EGN's nanny matching process, search fees, babysitting memberships, nanny subscriptions, vetting, and guarantees in New Jersey.",
  alternates: { canonical: "/faqs" },
};

export default function FaqsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <PageHero
        eyebrow="Help Center"
        title="Frequently asked questions"
        sub="Straight answers on process, pricing, safety, and working with us — for families, nannies, and babysitters."
      />

      <section className="bg-cream-100 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <nav className="flex flex-wrap justify-center gap-2" aria-label="FAQ categories">
              {FAQ_CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  {cat.label}
                </a>
              ))}
            </nav>
          </Reveal>

          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.id} id={cat.id} className="mt-12 scroll-mt-36">
              <Reveal>
                <SectionHeader align="left" eyebrow={cat.label} title={<>{cat.label}</>} />
              </Reveal>
              <Reveal>
                <div className="mt-6">
                  <FaqAccordion faqs={FAQS.filter((f) => f.category === cat.id)} defaultOpen={0} />
                </div>
              </Reveal>
            </div>
          ))}

          <Reveal>
            <div className="mt-12 rounded-3xl border border-teal-border bg-teal-pale p-8 text-center">
              <h2 className="text-xl font-extrabold text-ink-900">Still have questions?</h2>
              <p className="mt-2 text-slate-600">
                Call us at <a href={SITE.phoneHref} className="font-bold text-ink-900 hover:underline">{SITE.phone}</a> ({SITE.hours}){" "}
                or send a message — {SITE.responsePromise}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="bg-cream-100 pb-20">
        <CtaBand title="Ready to get started?" sub="Talk to a real recruiter — no chatbots, no phone trees." />
      </div>
    </>
  );
}
