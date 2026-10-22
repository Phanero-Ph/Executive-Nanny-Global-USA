import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { SITE, SERVICE_AREAS } from "@/data/site";
import { PageHero, SectionHeader } from "@/components/ui";
import { Reveal } from "@/components/ui-client";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Contact Us — Branchburg, NJ",
  description:
    "Contact Executive Global Nanny for your childcare needs. Serving New Jersey and surrounding areas from Branchburg, with business hours Monday–Friday, 8am–6pm EST.",
  alternates: { canonical: "/contact" },
};

const CONTACT_EMAIL = SITE.email;

const CARDS = [
  { icon: Phone, title: "Phone", lines: [SITE.phone, "Call us during business hours"], href: SITE.phoneHref, action: "Call Now" },
  { icon: Mail, title: "Email", lines: [CONTACT_EMAIL, "Send us a message anytime"], href: `mailto:${CONTACT_EMAIL}`, action: "Send email" },
  { icon: MapPin, title: "Location", lines: ["Serving NJ and surrounding areas", "Branchburg, New Jersey"], href: undefined, action: undefined },
  { icon: Clock, title: "Business Hours", lines: [SITE.hours, "We respond within 24 hours"], href: undefined, action: undefined },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Contact Executive Global Nanny"
        sub="We're here to help with all your childcare needs. Reach out to us through any of the methods below."
      />

      <section className="bg-cream-100 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((card, i) => (
              <Reveal key={card.title} delay={i * 70}>
                <div className="h-full rounded-3xl border border-cream-300 bg-white p-6 shadow-card">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900">
                    <card.icon className="h-5 w-5 text-ember-400" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-extrabold text-ink-900">{card.title}</h2>
                  {card.lines.map((line) => (
                    <p key={line} className="mt-1 text-[15px] font-medium break-words text-slate-600">
                      {line}
                    </p>
                  ))}
                  {card.href && (
                    <a href={card.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-ember-600 hover:underline">
                      {card.action} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-5">
            <Reveal className="lg:col-span-3">
              <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-card sm:p-9">
                <h2 className="text-2xl font-extrabold text-ink-900">Send us a message</h2>
                <p className="mt-1.5 text-[15px] text-slate-500">Contact us for emergency childcare, last-minute babysitting, or to learn more about our backup care services. For life-threatening emergencies, call 911.</p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </Reveal>
            <div className="space-y-6 lg:col-span-2">
              <Reveal delay={100}>
                <div className="rounded-3xl bg-ink-900 p-7 text-white shadow-card-lg">
                  <SectionHeader light align="left" eyebrow="Get In Touch" title={<>Need Backup Care?</>} />
                  <div className="mt-5 space-y-2.5">
                    {[
                      { label: "Request Backup Care", href: `mailto:${CONTACT_EMAIL}?subject=Backup%20Care%20Request` },
                      { label: "Call Now", href: SITE.phoneHref },
                      { label: "Send us a message anytime", href: `mailto:${CONTACT_EMAIL}` },
                      { label: "Emergency Services: Call 911", href: "tel:911" },
                    ].map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:border-ember-500 hover:bg-ember-500/10"
                      >
                        {l.label}
                        <ArrowRight className="h-4 w-4 text-ember-400" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <div className="rounded-3xl border border-cream-300 bg-white p-7 shadow-card">
                  <h2 className="font-extrabold text-ink-900">Serving NJ and surrounding areas</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SERVICE_AREAS.map((a) => (
                      <span
                        key={a.slug}
                        className="rounded-full bg-cream-100 px-3.5 py-1.5 text-sm font-bold text-ink-900"
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
