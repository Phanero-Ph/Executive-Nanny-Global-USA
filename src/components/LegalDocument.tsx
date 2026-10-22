import Link from "next/link";
import { ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";
import { PageHero, CtaBand } from "@/components/ui";
import { SITE } from "@/data/site";

type LegalSubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
};

export function LegalDocument({
  title,
  description,
  sections,
  contactTitle,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
  contactTitle: string;
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} sub={description} />
      <section className="bg-cream-100 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <nav aria-label={`${title} sections`} className="rounded-3xl border border-cream-300 bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <BookOpen className="h-4 w-4 text-teal-brand" aria-hidden="true" />
                On this page
              </div>
              <ol className="mt-4 space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="flex gap-3 rounded-lg px-2 py-2 text-sm leading-5 text-slate-600 transition-colors hover:bg-cream-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand">
                      <span className="shrink-0 text-xs font-bold text-teal-brand">{String(index + 1).padStart(2, "0")}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-cream-300 pt-4 text-xs leading-5 text-slate-500">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal-brand" aria-hidden="true" />
                Last updated October 22, 2026
              </div>
            </nav>
          </aside>

          <div className="space-y-5">
            {sections.map((section) => (
              <section id={section.id} key={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-28 rounded-3xl border border-cream-300 bg-white p-6 shadow-card sm:p-8">
                <h2 id={`${section.id}-heading`} className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{section.title}</h2>
                {section.paragraphs?.length ? <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}
                {section.bullets?.length ? <ul className="mt-4 space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-ember-500 sm:text-base">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                {section.subsections?.length ? <div className="mt-6 space-y-6">{section.subsections.map((subsection) => <div key={subsection.title} className="border-t border-cream-200 pt-5 first:border-0 first:pt-0"><h3 className="text-base font-bold text-ink-900 sm:text-lg">{subsection.title}</h3>{subsection.paragraphs?.length ? <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 sm:text-base">{subsection.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}{subsection.bullets?.length ? <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-ember-500 sm:text-base">{subsection.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>)}</div> : null}
              </section>
            ))}

            <section className="rounded-3xl border border-teal-border bg-teal-pale p-6 sm:p-8" aria-labelledby="legal-contact-heading">
              <p className="text-xs font-bold tracking-[0.16em] text-teal-brand uppercase">Need help?</p>
              <h2 id="legal-contact-heading" className="mt-2 text-xl font-extrabold text-ink-900">{contactTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Executive Global Nanny LLC · Branchburg, New Jersey</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
                <a className="text-teal-brand underline decoration-teal-border underline-offset-4 hover:text-ink-900" href={`mailto:${SITE.email}`}>{SITE.email}</a>
                <a className="text-teal-brand underline decoration-teal-border underline-offset-4 hover:text-ink-900" href={SITE.phoneHref}>{SITE.phone}</a>
              </div>
              <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ink-900 hover:text-teal-brand">
                Contact our team <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          </div>
        </div>
      </section>
      <div className="bg-cream-100 pb-16 sm:pb-20">
        <CtaBand title="Here when you need us" sub="Our team is happy to answer questions about your account, placement, or the information we handle." />
      </div>
    </>
  );
}
