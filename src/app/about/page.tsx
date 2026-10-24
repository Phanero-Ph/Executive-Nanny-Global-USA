import type { Metadata } from "next";
import { PublicImage as Image } from "@/components/PublicImage";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, GraduationCap, MapPin, MessageCircle, Users, Award, Check } from "lucide-react";
import { PageHero, SectionHeader, CtaBand } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "About Us — Premier Childcare Training & Placement",
  description: "Discover Executive Global Nanny's mission, vision, nanny and babysitter matching process, and professional training programs for families across New Jersey.",
  alternates: { canonical: "/about" },
};

const STEPS = [
  { icon: MessageCircle, title: "We Interview", text: "Each nanny undergoes an intensive interview before being placed with a family, to ensure only the top qualified candidates are picked." },
  { icon: ShieldCheck, title: "We Check", text: "We conduct thorough background checks to ensure that our nannies and babysitters meet our high standards of professionalism and trustworthiness." },
  { icon: Users, title: "We Match", text: "We carefully pair families with nannies and babysitters based on qualifications, experience, and personality to ensure a harmonious working relationship." },
  { icon: HeartHandshake, title: "We Stay Connected", text: "Throughout the placement process, we ensure constant communication and support to families, nannies, and babysitters." },
];
const TRAINING = ["Child Development & Psychology", "First Aid & CPR Certification", "Nutrition & Meal Planning", "Behavioral Management Techniques"];

export default function AboutPage() {
  return <>
    <PageHero
      eyebrow="All About Care"
      title="Discover Exceptional Care for Every Family"
      sub="We believe that every family deserves the best. From personalized nanny placements to expert training programs and specialized aftercare services, we are committed to providing a nurturing environment where children can thrive."
    />

    <section className="bg-cream-100 py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal><div className="relative">
          <div className="overflow-hidden rounded-[2rem] shadow-card-lg">
            <Image src="/images/about/family.webp" alt="Joyful family playing together" width={1000} height={750} className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="absolute -right-3 -bottom-6 rounded-2xl bg-ink-900 px-6 py-4 text-white shadow-card-lg sm:-right-6">
            <MapPin className="mb-1 h-7 w-7 text-ember-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-teal-mist/85">Proudly serving New Jersey</p>
          </div>
        </div></Reveal>
        <div>
          <Reveal><SectionHeader align="left" eyebrow="Our Purpose" title={<>Our Mission</>} /></Reveal>
          <Reveal delay={100}><div className="mt-5 space-y-4 leading-relaxed text-slate-600">
            <p>Our mission at Executive Global Nanny is simple: to empower families to thrive by providing exceptional, personalized childcare solutions that meet their unique needs and lifestyle.</p>
            <p>We are dedicated to delivering world-class care, education, and support to children, while fostering a culture of trust, respect, and open communication with our clients.</p>
            <p>Our goal is to create a nurturing environment that allows children to grow, learn, and flourish, while providing parents with peace of mind and confidence in their childcare choice.</p>
            <h3 className="pt-3 text-2xl font-extrabold text-ink-900">Our Vision</h3>
            <p>To revolutionize the childcare industry by setting a new standard for excellence, innovation, and personalized service. We aim to build a global community of families, nannies, and partners who share our passion for providing exceptional care and support. By leveraging our expertise, resources, and network, we strive to make a positive impact on the lives of children, families, and communities worldwide, one family at a time.</p>
          </div></Reveal>
          <Reveal delay={160}><dl className="mt-8 grid grid-cols-3 gap-4">
            {[{value:"4–8 Weeks",label:"Course duration"},{value:"12+",label:"Training modules"},{value:"98%",label:"Training success rate"}].map(s=><div key={s.label} className="rounded-2xl border border-cream-300 bg-white p-4 text-center shadow-sm"><dd className="text-xl font-extrabold text-ink-900 sm:text-2xl">{s.value}</dd><dt className="mt-1 text-xs font-medium text-slate-500">{s.label}</dt></div>)}
          </dl></Reveal>
        </div>
      </div>
    </section>

    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal><SectionHeader eyebrow="How We Work" title={<>How It Works</>} /></Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {STEPS.map((step,i)=><Reveal key={step.title} delay={(i%2)*90}><div className="flex h-full gap-5 rounded-3xl border border-cream-300 bg-cream-100 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink-900"><step.icon className="h-7 w-7 text-ember-400" aria-hidden="true" /></span>
            <div><h3 className="text-lg font-extrabold text-ink-900">{step.title}</h3><p className="mt-2 leading-relaxed text-slate-600">{step.text}</p></div>
          </div></Reveal>)}
        </div>
      </div>
    </section>

    <section className="bg-ink-900 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal><SectionHeader light eyebrow="Our Community" title={<>Proudly Serving New Jersey</>} sub="We primarily serve families across the entire state of New Jersey, bringing trusted childcare to communities from Newark to Princeton, Jersey City to Atlantic City, and everywhere in between." /></Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal><div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <GraduationCap className="h-8 w-8 text-ember-400" aria-hidden="true" /><h3 className="mt-4 text-xl font-extrabold text-white">The Training Programs</h3><p className="mt-2 leading-relaxed text-teal-mist/85">From Basic to World-Class Nanny</p><p className="mt-4 leading-relaxed text-teal-mist/85">Our comprehensive training programs are designed to empower nannies with essential skills, from advanced child development techniques to effective communication and safety protocols.</p>
          </div></Reveal>
          <Reveal delay={90}><div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <Award className="h-8 w-8 text-ember-400" aria-hidden="true" /><h3 className="mt-4 text-xl font-extrabold text-white">Professional Development</h3><ul className="mt-4 space-y-3">{TRAINING.map(item=><li key={item} className="flex items-start gap-2 text-teal-mist/85"><Check className="mt-1 h-4 w-4 shrink-0 text-ember-400" aria-hidden="true" />{item}</li>)}</ul><Link href="/training" className="mt-5 inline-block font-semibold text-ember-400 hover:underline">Explore Training Programs →</Link>
          </div></Reveal>
          <Reveal delay={180}><div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <ShieldCheck className="h-8 w-8 text-ember-400" aria-hidden="true" /><h3 className="mt-4 text-xl font-extrabold text-white">Certification Program</h3><p className="mt-2 leading-relaxed text-teal-mist/85">Industry-recognized credentials</p><dl className="mt-4 space-y-3">{[{label:"Course Duration",value:"4–8 Weeks"},{label:"Training Modules",value:"12+"},{label:"Success Rate",value:"98%"}].map(item=><div key={item.label} className="flex flex-wrap justify-between gap-2 text-sm"><dt className="text-teal-mist/85">{item.label}</dt><dd className="font-semibold text-ember-400">{item.value}</dd></div>)}</dl>
          </div></Reveal>
        </div>
      </div>
    </section>
    <div className="bg-ink-900 pb-20"><CtaBand title="Join Our Community" sub="At Executive Global Nanny, we don't just place nannies—we build relationships. Join our community today and benefit from ongoing support, career development, and the opportunity to make a lasting difference in the lives of children and families." primary={{label:"Contact Us Now",href:"/contact"}} secondary={{label:"Discover More",href:"/services"}} /></div>
  </>;
}
