import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SERVICE_AREAS, SITE } from "@/data/site";
import { CtaBand, JsonLd, PageHero } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "Nanny & Babysitting Service Areas in New Jersey",
  description:
    "Explore Executive Global Nanny's local service areas across Somerset, Hunterdon, Morris, Middlesex, and Mercer counties in New Jersey. Based in Branchburg, serving families across the U.S.",
  alternates: { canonical: "/service-areas" },
};

export default function ServiceAreasPage() {
  return (
    <>
      <PageHero
        eyebrow="Where We Work"
        title="Nanny and babysitting services in New Jersey"
        sub={`Based in ${SITE.address}, Executive Global Nanny supports families across New Jersey, with services available to families throughout the United States.`}
      />
      <main className="bg-cream-100 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Our local area pages explain the nanny placement, babysitting, and childcare support available in the communities we serve most closely. If you are outside these New Jersey areas, contact us to discuss service availability in your state.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_AREAS.map((area, i) => (
              <Reveal key={area.slug} delay={(i % 3) * 60}>
                <Link
                  href={`/service-areas/${area.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-cream-300 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-brand"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-pale text-teal-brand" aria-hidden="true">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span className="mt-4 text-xs font-bold uppercase tracking-wider text-ember-600">{area.county}, NJ</span>
                  <span className="mt-1 text-xl font-extrabold text-ink-900">{area.name}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{area.description[0]}</span>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-brand">Explore this area <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <div className="bg-white py-16 sm:py-20">
        <CtaBand
          title="Looking for childcare outside New Jersey?"
          sub="We work with families across the United States. Contact our team to discuss what is available in your location."
          primary={{ label: "Contact Us", href: "/contact" }}
        />
      </div>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "New Jersey Nanny and Babysitting Service Areas",
        url: "https://executiveglobalnannyusa.com/service-areas",
        about: { "@id": "https://executiveglobalnannyusa.com/#localbusiness" },
        inLanguage: "en-US",
      }} />
    </>
  );
}
