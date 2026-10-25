import type { Metadata } from "next";
import { PublicImage as Image } from "@/components/PublicImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, PhoneCall } from "lucide-react";
import { SERVICES, serviceBySlug, SITE } from "@/data/site";
import { PageHero, SectionHeader, CtaBand, ServiceIcon, JsonLd } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return { title: "Service Not Found" };
  return {
    title: `${service.title} in New Jersey`,
    description: `${service.description} Serving Branchburg, Somerset County & all of NJ with vetted, CPR-certified nannies and babysitters.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const related = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.description,
          provider: {
            "@type": "LocalBusiness",
            name: "Executive Global Nanny LLC",
            telephone: "+1-609-429-6399",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Branchburg",
              addressRegion: "NJ",
              postalCode: "08876",
              addressCountry: "US",
            },
          },
          areaServed: { "@type": "State", name: "New Jersey" },
        }}
      />

      <PageHero
        eyebrow={service.startingAt}
        title={service.title}
        sub={service.description}
      />

      <section className="bg-cream-100 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <Reveal>
              <div className="overflow-hidden rounded-3xl shadow-card">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={1200}
                  height={700}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-8 space-y-4 text-[17px] leading-relaxed text-slate-600">
                {service.longDescription.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-8 rounded-3xl border border-cream-300 bg-white p-7 shadow-card sm:p-8">
                <h2 className="text-xl font-extrabold text-ink-900">What&apos;s included</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] font-semibold text-slate-700">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ember-500/15">
                        <Check className="h-3.5 w-3.5 text-ember-600" aria-hidden="true" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Reveal>
              <div className="rounded-3xl bg-ink-900 p-7 text-white shadow-card-lg">
                <ServiceIcon name={service.icon} className="h-8 w-8 text-ember-400" />
                <h2 className="mt-3 text-xl font-extrabold">Request this service</h2>
                <p className="mt-2 text-sm leading-relaxed text-teal-mist/85">
                  Free consultation. Your recruiter responds within one business day.
                </p>
                <Link
                  href="/find-nanny"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-6 py-3.5 font-bold text-white shadow-ember transition hover:bg-ember-600"
                >
                  Find a Nanny <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href={SITE.phoneHref}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-white/25 px-6 py-3 font-bold text-white transition hover:border-white hover:bg-white/10"
                >
                  <PhoneCall className="h-4 w-4" aria-hidden="true" /> {SITE.phone}
                </a>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="rounded-3xl border border-cream-300 bg-white p-7 shadow-card">
                <h2 className="text-lg font-extrabold text-ink-900">Ideal for</h2>
                <ul className="mt-3 space-y-2.5">
                  {service.idealFor.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] text-slate-600">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-teal-brand" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-2xl bg-cream-100 p-4 text-sm">
                  <p className="font-extrabold text-ink-900">{service.startingAt}</p>
                  <Link href="/pricing" className="font-bold text-ember-600 hover:underline">
                    See full pricing →
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <SectionHeader align="left" eyebrow="Keep Exploring" title={<>Related services</>} />
              <Link href="/services" className="hidden shrink-0 items-center gap-1.5 font-bold text-ember-600 hover:underline sm:inline-flex">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All services
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((r, i) => (
              <Reveal key={r.slug} delay={i * 90}>
                <Link
                  href={`/services/${r.slug}`}
                  className="group block h-full overflow-hidden rounded-3xl border border-cream-300 bg-cream-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg"
                >
                  <div className="overflow-hidden">
                    <Image
                      src={r.image}
                      alt={r.title}
                      width={700}
                      height={440}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-extrabold text-ink-900">{r.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.short}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-white pb-20">
        <CtaBand
          title={`Ready for ${service.title.toLowerCase()}?`}
          sub="Tell us what your family needs — a dedicated recruiter will respond within one business day."
        />
      </div>
    </>
  );
}
