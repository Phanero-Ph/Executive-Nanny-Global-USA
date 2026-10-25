import { PublicImage as Image } from "@/components/PublicImage";
import Link from "next/link";
import {
  ShieldCheck,
  HeartPulse,
  BadgeCheck,
  ArrowRight,
  PhoneCall,
  CalendarCheck,
  Search,
  Users,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  Star,
  MapPin,
  Check,
  Sparkles,
  Clock3,
  FileCheck2,
} from "lucide-react";
import {
  SITE,
  IMAGES,
  SERVICE_AREAS,
  TOWNS_MARQUEE,
} from "@/data/site";
import { HOME_SERVICES, HOME_TESTIMONIALS, HOME_FAQS, HOME_BLOG_POSTS, HOME_STATS } from "@/data/home";
import { SectionHeader, CtaButton, Stars, ServiceIcon, JsonLd } from "@/components/ui";
import { Reveal, FaqAccordion, TestimonialCarousel } from "@/components/ui-client";
import { FamilyRequestForm } from "@/components/forms";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://executiveglobalnannyusa.com",
    name: "Executive Global Nanny LLC",
    description:
      "Professional nanny placement, babysitting services, and backup childcare in Branchburg and throughout New Jersey.",
    url: "https://executiveglobalnannyusa.com",
    telephone: "+1-908-505-5484",
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Branchburg",
      addressRegion: "NJ",
      postalCode: "08876",
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: "40.5618", longitude: "-74.7102" },
    areaServed: [{ "@type": "State", name: "New Jersey" }],
    priceRange: "$$",
    openingHours: "Mo-Fr 08:00-18:00",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Executive Global Nanny",
    url: "https://executiveglobalnannyusa.com",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ================================ HERO ================================ */}
      <section className="relative overflow-hidden bg-cream-100">
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-ember-200/50 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[-20%] left-[-8%] h-[24rem] w-[24rem] rounded-full bg-teal-border/60 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-20 lg:pb-24">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-ember-200 bg-white px-4 py-1.5 text-xs font-bold tracking-wide text-ink-900 uppercase shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-ember-500" aria-hidden="true" />
                Branchburg, NJ · Serving All of New Jersey
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-ink-900 sm:text-5xl lg:text-[3.6rem]">
                Trusted Nannies. Expert Care <span className="relative inline-block text-ember-600">Anywhere
                  <svg viewBox="0 0 220 12" className="absolute -bottom-1 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M3 9C60 3 160 3 217 8" stroke="#FF8C42" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.5" />
                  </svg>
                </span>{" "}Anytime
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                At Executive Global Nanny, we help families thrive by providing reliable and nurturing childcare
                solutions that meet the unique needs of each household.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaButton href="/find-nanny" size="lg">
                  Find a Nanny <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </CtaButton>
                <CtaButton href="/signup?role=nanny" variant="outline-ink" size="lg">
                  I&apos;m a Nanny
                </CtaButton>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="flex items-center gap-2">
                  <Stars rating={5} />
                  <span className="text-sm font-bold text-ink-900">5.0 · 100+ Google Reviews</span>
                </span>
                <a href={SITE.phoneHref} className="flex items-center gap-2 text-sm font-bold text-ink-900 transition hover:text-ember-600">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-white">
                    <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {SITE.phone}
                </a>
              </div>
            </Reveal>
          </div>

          {/* Hero visual */}
          <Reveal delay={200} className="relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-ember-300/60 via-transparent to-teal-light/40 blur-xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-white shadow-card-lg">
                <Image
                  src={IMAGES.hero}
                  alt="Nanny joyfully playing with a young child in a bright New Jersey living room"
                  width={1200}
                  height={800}
                  priority
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-3 animate-float rounded-2xl border border-cream-300 bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:-left-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900">
                    <ShieldCheck className="h-5 w-5 text-ember-400" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink-900">Background-Checked</p>
                    <p className="text-xs font-medium text-slate-500">Vetted, CPR-certified nannies and babysitters</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-5 -right-2 animate-float-slow rounded-2xl border border-cream-300 bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:-right-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember-500">
                    <BadgeCheck className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink-900">90-Day Guarantee</p>
                    <p className="text-xs font-medium text-slate-500">Guaranteed replacement period</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Stats */}
        <div className="relative border-t border-cream-300/70 bg-white/60 backdrop-blur">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
            {HOME_STATS.map((s) => (
              <div key={s.label} className="text-center lg:text-left">
                <dt className="order-2 mt-1 block text-sm font-medium text-slate-500">{s.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight text-ink-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================ TOWNS MARQUEE ============================ */}
      <div className="overflow-hidden bg-ink-900 py-4" aria-label="Towns we serve">
        <div className="animate-marquee flex w-max items-center gap-8 pr-8">
          {[...TOWNS_MARQUEE, ...TOWNS_MARQUEE].map((town, i) => (
            <span key={i} className="flex items-center gap-8 text-sm font-bold tracking-[0.18em] whitespace-nowrap text-teal-mist/90 uppercase">
              {town}, NJ
              <Star className="h-3.5 w-3.5 fill-ember-500 text-ember-500" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>

      {/* =============================== SERVICES ============================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="Our Services"
              title={<>Tailored Childcare Solutions</>}
              sub="Professional babysitting, backup childcare, and full-time nanny placements in Branchburg and across New Jersey — safe, reliable, and convenient for your family."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_SERVICES.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 90}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cream-300 bg-cream-100 transition-all duration-300 hover:-translate-y-1.5 hover:border-ember-300 hover:shadow-card-lg"
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      width={800}
                      height={500}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 rounded-full bg-ink-900/90 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur">
                      {service.startingAt}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-ember-400 transition-colors group-hover:bg-ember-500 group-hover:text-white">
                      <ServiceIcon name={service.icon} />
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ink-900">{service.title}</h3>
                    <p className="mt-2 flex-1 leading-relaxed text-slate-600">{service.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ember-600">
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= HOW IT WORKS ============================ */}
      <section className="relative overflow-hidden bg-cream-100 py-20 sm:py-24">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="How We Work"
              title={<>The Executive Global Nanny Process</>}
              sub="Finding the right nanny or babysitter doesn't have to take weeks. Our quick and efficient service provides peace of mind while saving you valuable time."
            />
          </Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CalendarCheck, step: "Step 1", title: "We Interview", text: "Thorough interviews to pick only qualified candidates." },
              { icon: Search, step: "Step 2", title: "We Check", text: "Rigorous background checks and reference verification." },
              { icon: Users, step: "Step 3", title: "We Match", text: "Meticulous match process based on your family's needs." },
              { icon: ClipboardCheck, step: "Step 4", title: "72 Hours to Your Perfect Match", text: "From your first consultation to meeting your perfectly matched nanny or babysitter, our streamlined process delivers results in just 3 days." },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <li className="relative h-full rounded-3xl border border-cream-300 bg-white p-7 shadow-card">
                  <span className="absolute -top-3.5 left-7 rounded-full bg-ember-500 px-3 py-1 text-xs font-extrabold tracking-wide text-white uppercase">
                    {s.step}
                  </span>
                  <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-teal-pale p-3 text-ink-900">
                    <s.icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold text-ink-900">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal>
            <div className="mt-10 text-center">
              <CtaButton href="/find-nanny" size="lg">
                Find A Nanny <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </CtaButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ VETTING / SAFETY ========================= */}
      <section className="relative overflow-hidden bg-ink-900 py-20 sm:py-24">
        <div className="dot-grid-light absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-ember-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-card-lg">
                <Image
                  src={IMAGES.readingBook}
                  alt="Nanny reading with a child during a calm afternoon"
                  width={1000}
                  height={750}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="absolute -right-3 -bottom-6 flex items-center gap-3 rounded-2xl bg-ember-500 px-5 py-4 shadow-ember sm:-right-6">
                <HeartPulse className="h-8 w-8 text-white" aria-hidden="true" />
                <div>
                  <p className="text-lg leading-tight font-extrabold text-white">100% CPR-Certified</p>
                  <p className="text-sm font-medium text-white/85">Trusted care for your family</p>
                </div>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <SectionHeader
                align="left"
                light
                eyebrow="About Us"
                title={<>Empowering Families, Transforming Lives</>}
                sub="At Executive Global Nanny, our mission is to empower families to thrive by providing exceptional, personalized childcare solutions that meet their unique needs and lifestyle. Our vision is to set new standards for excellence and innovation in the childcare industry, impacting the lives of children, families, and communities worldwide."
              />
            </Reveal>
            <ul className="mt-8 space-y-4">
              {[
                { icon: FileCheck2, title: "Social Security Number Trace", text: "Identity verification as part of nanny and babysitter screening." },
                { icon: Search, title: "National Criminal Database Search", text: "Thorough background checks for professionalism and trustworthiness." },
                { icon: Users, title: "Motor Vehicle Report", text: "Driving-record review included in placement screening." },
                { icon: HeartPulse, title: "CPR/First Aid Certification Verification", text: "Certified nannies and babysitters prepared to support your family's safety." },
                { icon: BadgeCheck, title: "Sex Offender Records", text: "Records checked as part of nanny and babysitter screening." },
                { icon: ShieldCheck, title: "Trial & Backup Care", text: "A 2-day trial period (family pays the candidate) and 5 days of complimentary backup care." },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 60}>
                  <li className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-ember-500/50 hover:bg-white/10">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-500/15 text-ember-400">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-white">{item.title}</h3>
                      <p className="text-sm text-teal-mist/80">{item.text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================== FOR NANNIES ============================ */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="order-2 lg:order-1">
            <Reveal>
              <SectionHeader
                align="left"
                eyebrow="Our Programs"
                title={<>EGN Training Programs For You</>}
                sub="We don't just provide care. We teach you how to care."
              />
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Wallet, title: "Basic Nanny Training", text: "Childcare essentials, safety protocols, and age-appropriate activities." },
                { icon: GraduationCap, title: "Professional Nanny Training", text: "Advanced skills and career development for nannies seeking to advance their careers." },
                { icon: Users, title: "Weekly Instagram Series", text: "Conversations on childcare, nannying, parenting and motherhood. You could be one of our guests." },
                { icon: Clock3, title: "Professional Certification", text: "Training programs that help you develop essential caregiving skills." },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="h-full rounded-2xl border border-cream-300 bg-cream-100 p-5">
                    <f.icon className="h-6 w-6 text-ember-600" aria-hidden="true" />
                    <h3 className="mt-2 font-extrabold text-ink-900">{f.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{f.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaButton href="/signup?role=nanny">I&apos;m A Nanny <ArrowRight className="h-4 w-4" aria-hidden="true" /></CtaButton>
                <CtaButton href="/training" variant="outline-ink">Explore Training</CtaButton>
              </div>
              <p className="mt-3 text-sm text-slate-500">Expert conversations, community engagement, and guest opportunities.</p>
            </Reveal>
          </div>
          <Reveal className="order-1 lg:order-2">
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-card-lg">
                <Image
                  src={IMAGES.training1}
                  alt="Nannies learning together at the EGN Training Academy"
                  width={1000}
                  height={750}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-3 flex items-center gap-3 rounded-2xl border border-cream-300 bg-white px-5 py-4 shadow-card sm:-left-6">
                <Sparkles className="h-8 w-8 text-ember-500" aria-hidden="true" />
                <div>
                  <p className="text-lg leading-tight font-extrabold text-ink-900">250+ nannies</p>
                  <p className="text-sm font-medium text-slate-500">trained &amp; hired</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== SERVICE AREAS ========================== */}
      <section className="bg-cream-100 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="Areas We Serve"
              title={<>Families Across New Jersey</>}
              sub="Central Jersey, North Jersey, and South Jersey — including Bergen, Hudson, Essex, Morris, Passaic, Middlesex, Monmouth, Somerset, Mercer, Burlington, and Gloucester counties."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_AREAS.map((area, i) => (
              <Reveal key={area.slug} delay={(i % 4) * 70}>
                <div
                  className="relative block overflow-hidden rounded-2xl shadow-card"
                >
                  <Image
                    src={area.image}
                    alt={`Childcare services in ${area.name}, NJ`}
                    width={600}
                    height={400}
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent" aria-hidden="true" />
                  <span className="absolute right-4 bottom-4 left-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-ember-300 uppercase">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {area.county}
                    </span>
                    <span className="mt-1 block text-xl font-extrabold text-white">{area.name}, NJ</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== TESTIMONIALS =========================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="What Families Say"
              title={<>Trusted by Families in Branchburg &amp; Across New Jersey</>}
              sub="5.0 — Based on 100+ Google Reviews"
            />
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12">
              <TestimonialCarousel testimonials={HOME_TESTIMONIALS} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================= BLOG ================================ */}
      <section className="bg-cream-100 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeader
                align="left"
                eyebrow="Blogs"
                title={<>Caregiving 101: Stories, Insights, Tips</>}
                sub="Get the latest tips, trends, and advice on childcare, home management, and family life. Explore expert insights, success stories, and practical guides curated just for you."
              />
              <CtaButton href="/blog" variant="outline-ink" size="sm" className="shrink-0">
                View More <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </CtaButton>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOME_BLOG_POSTS.map((post, i) => (
              <Reveal key={post.slug} delay={i * 90}>
                <Link
                  href={post.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cream-300 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-lg"
                >
                  <div className="overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={800}
                      height={500}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-xs font-bold tracking-wider text-ember-600 uppercase">{post.category}</span>
                    <h3 className="mt-2 text-lg leading-snug font-extrabold text-ink-900 transition-colors group-hover:text-ember-600">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-[15px] text-slate-600">{post.excerpt}</p>
                    <span className="mt-4 text-sm font-semibold text-slate-500">{post.date} · {post.readTime}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================= FAQ ================================= */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="FAQ"
              title={<>Frequently Asked Questions</>}
              sub="Find answers to common questions about our childcare services."
            />
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10">
              <FaqAccordion faqs={HOME_FAQS} />
              <div className="mt-8 text-center">
                <CtaButton href="/faqs" variant="outline-ink">
                  View All FAQs <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </CtaButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =============================== LEAD FORM ============================= */}
      <section className="bg-cream-100 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-14 lg:px-8">
          <div className="lg:col-span-2">
            <Reveal>
              <SectionHeader
                align="left"
                eyebrow="Get Started"
                title={<>Your Partner in Quality Childcare</>}
                sub="We understand that finding quality childcare is essential for busy families. Our babysitting services, backup care, and full-time nanny placements connect you with highly vetted, CPR-certified nannies and babysitters."
              />
            </Reveal>
            <Reveal delay={100}>
              <ul className="mt-8 space-y-4">
                {[
                  "Fast Matching · Vetted Nannies and Babysitters · Peace of Mind",
                  "Personalized Matching & Ongoing Support",
                  "90 days guaranteed replacement period",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white px-5 py-4 font-semibold text-ink-900 shadow-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember-500/15">
                      <Check className="h-4 w-4 text-ember-600" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl bg-ink-900 p-6 text-white">
                <p className="text-sm font-semibold text-teal-mist/80">Call Us Here</p>
                <a href={SITE.phoneHref} className="mt-1 flex items-center gap-2 text-2xl font-extrabold transition hover:text-ember-400">
                  <PhoneCall className="h-6 w-6 text-ember-400" aria-hidden="true" />
                  {SITE.phone}
                </a>
                <p className="mt-1 text-sm text-teal-mist/80">{SITE.hours} · {SITE.responsePromise}</p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={150} className="lg:col-span-3">
            <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-card sm:p-9">
              <FamilyRequestForm compact />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
