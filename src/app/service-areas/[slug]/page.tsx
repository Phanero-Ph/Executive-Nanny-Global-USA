import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { areaBySlug, SERVICE_AREAS, SERVICES, SITE } from "@/data/site";
import { CtaBand, JsonLd, PageHero } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

const SITE_URL = "https://executiveglobalnannyusa.com";

export function generateStaticParams() {
  return SERVICE_AREAS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const area = areaBySlug(slug);
  if (!area) return { title: "Service Area Not Found", robots: { index: false, follow: false } };

  return {
    title: `Nanny & Babysitting Services in ${area.name}, NJ`,
    description: `${area.description[0]} Executive Global Nanny serves ${area.name} and nearby New Jersey communities.`,
    alternates: { canonical: `/service-areas/${area.slug}` },
  };
}

export default async function ServiceAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = areaBySlug(slug);
  if (!area) notFound();

  const crumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Service Areas", item: `${SITE_URL}/service-areas` },
    { "@type": "ListItem", position: 3, name: area.name, item: `${SITE_URL}/service-areas/${area.slug}` },
  ];

  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs,
        },
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: `Nanny and babysitting services in ${area.name}, New Jersey`,
          description: area.description.join(" "),
          provider: { "@id": `${SITE_URL}/#localbusiness` },
          areaServed: [
            { "@type": area.name.endsWith("County") ? "AdministrativeArea" : "City", name: area.name },
            { "@type": "AdministrativeArea", name: area.county },
            { "@type": "State", name: "New Jersey" },
          ],
        },
      ]} />
      <PageHero
        eyebrow={`${area.county}, New Jersey`}
        title={`Nanny and babysitting services in ${area.name}`}
        sub={`Childcare support for families in ${area.name} and nearby communities. Our agency is based in ${SITE.address}.`}
      />
      <section className="bg-cream-100 py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-8 lg:col-span-2">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-600">
              <Link href="/" className="hover:text-ember-600">Home</Link><span className="px-2" aria-hidden="true">/</span>
              <Link href="/service-areas" className="hover:text-ember-600">Service Areas</Link><span className="px-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink-900">{area.name}</span>
            </nav>
            <section className="rounded-3xl border border-cream-300 bg-white p-7 shadow-card sm:p-9">
              <h2 className="text-2xl font-extrabold text-ink-900">Local childcare support</h2>
              <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-slate-600">
                {area.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <h3 className="mt-8 text-lg font-extrabold text-ink-900">Care families look for in {area.name}</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {area.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-brand" aria-hidden="true" />{highlight}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-cream-100 p-5">
                <h3 className="font-extrabold text-ink-900">Nearby ZIP codes</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Our local service area includes families in and around these ZIP codes. Contact us to confirm availability for your address.</p>
                <p className="mt-3 flex flex-wrap gap-2">{area.zips.map((zip) => <span key={zip} className="rounded-full border border-cream-300 bg-white px-3 py-1 text-sm font-bold text-ink-900">{zip}</span>)}</p>
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-extrabold text-ink-900">Services available to {area.name} families</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {SERVICES.map((service) => (
                  <Link key={service.slug} href={`/services/${service.slug}`} className="group rounded-2xl border border-cream-300 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-brand">
                    <h3 className="font-extrabold text-ink-900 group-hover:text-teal-brand">{service.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.short}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-ember-600">Learn more <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
          <aside className="h-fit rounded-3xl bg-ink-900 p-7 text-white shadow-card-lg">
            <MapPin className="h-7 w-7 text-ember-400" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-extrabold">Ask about care in {area.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-mist/90">Tell us your location, schedule, and care needs. Our team can confirm the service options for your family.</p>
            <Link href="/contact" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-5 py-3 font-bold text-white transition hover:bg-ember-600">Contact our team <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <a href={SITE.phoneHref} className="mt-3 block text-center font-bold text-white underline underline-offset-4">Call {SITE.phone}</a>
            <p className="mt-5 border-t border-white/15 pt-4 text-sm text-teal-mist/80">Based in {SITE.address}</p>
          </aside>
        </div>
      </section>
      <div className="bg-white py-16 sm:py-20">
        <CtaBand title={`Need a nanny or babysitter in ${area.name}?`} sub="Reach out and tell us what care your family needs. We will confirm what is available in your area." primary={{ label: "Contact Us", href: "/contact" }} />
      </div>
    </>
  );
}
