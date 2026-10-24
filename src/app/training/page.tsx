import type { Metadata } from "next";
import { PublicImage as Image } from "@/components/PublicImage";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MonitorPlay, Award, ClipboardCheck } from "lucide-react";
import { IMAGES, TRAINING_COURSES } from "@/data/site";
import { PageHero, SectionHeader, CtaBand, ServiceIcon } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "Training — Expert-Led Childcare Programs",
  description:
    "Explore expert-led childcare training, early childhood development, first aid and CPR, special needs childcare, nutrition, household management, and emotional intelligence.",
  alternates: { canonical: "/training" },
};

const COURSE_TOPICS = [
  { title: "Early Childhood Development", description: "Focus on developmental milestones and age-appropriate learning strategies." },
  { title: "Emergency First Aid and CPR", description: "Critical skills for managing emergencies, including first aid and life-saving techniques." },
  { title: "Special Needs Childcare", description: "Training on caring for children with special educational or developmental needs." },
  { title: "Nutrition and Meal Planning", description: "Understand the nutritional needs of children at various stages, and learn how to prepare balanced meals." },
  { title: "Household Management & Organizational Skills", description: "Learn the essentials of household management, and maintaining an organized, child-safe space." },
  { title: "Emotional Intelligence & Empathy Building", description: "Refine your ability to connect emotionally with children, fostering an environment where they feel valued." },
];

const PAGE_COURSES = TRAINING_COURSES.map((course, i) => ({
  ...course,
  ...COURSE_TOPICS[i],
  duration: "Learn at your pace",
  level: "Expert-Led Training",
}));

export default function TrainingPage() {
  return (
    <>
      <PageHero
        eyebrow="Expert-Led Training"
        title="Elevate Your Childcare Skills with Our Expert-Led Training"
        sub="Join a community of dedicated nannies and take the first step towards a fulfilling and impactful career. Our training programs are designed to equip you with the essential skills and confidence to excel in professional childcare, all while offering the flexibility you need to learn at your pace."
      />

      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionHeader
              align="left"
              eyebrow="Embark on a Rewarding Career in Childcare"
              title={<>Your Path to a Professional Nanny Career Begins Here</>}
              sub="At Executive Global Nanny, we pave the way for aspiring nannies to build a successful and rewarding career. Our training programs are meticulously crafted to provide not only essential childcare knowledge but also specialized skills that set you apart in the competitive childcare industry. Whether you're just starting or looking to advance your expertise, our courses are the key to unlocking your potential."
            />
            <ul className="mt-6 space-y-3">
              {[
                "500+ Graduates Certified",
                "95% Success Rate",
                "100+ Hours",
                "Essential childcare knowledge and specialized skills",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 font-medium text-slate-700">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-ember-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-4">
              {[IMAGES.training2, IMAGES.training3, IMAGES.training4, IMAGES.training1].map((img, i) => (
                <div key={i} className={`overflow-hidden rounded-2xl shadow-card ${i % 2 === 1 ? "mt-6" : ""}`}>
                  <Image src={img} alt="EGN Training Academy session" width={500} height={380} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="Courses to Explore"
              title={<>Discover Courses Tailored for Every Nanny</>}
              sub="And there's a lot more we have for you."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PAGE_COURSES.map((course, i) => (
              <Reveal key={course.title} delay={(i % 3) * 90}>
                <div className="flex h-full flex-col rounded-3xl border border-cream-300 bg-cream-100 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ember-300 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-ink-900 p-3 text-ember-400">
                      <ServiceIcon name={course.icon} className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-teal-pale px-3 py-1 text-xs font-bold text-ink-800">{course.level}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-ink-900">{course.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-ember-600">{course.duration}</p>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{course.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              eyebrow="Enroll Now"
              title={<>Become a World-Class Nanny</>}
            />
          </Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: MonitorPlay, title: "Basic Nanny Training", text: "Essentials · Coming soon. Get started with our collection of basic nanny training video course content: 72 hours of video courses, fully remote learning, Basic Nanny Certification, 1-month access, and job placement." },
              { icon: ClipboardCheck, title: "Live Workshops & Seminars", text: "For Parents · Most Popular. Lifetime access to recorded sessions, real-time Q&A with industry experts, interactive skill-building exercises, comprehensive childcare techniques, and 24/7 updates, tips and information. Make an inquiry to learn more." },
              { icon: Award, title: "Professional Nanny Training", text: "Advanced/Upskill · Coming soon. Our comprehensive professional nanny training series supports your career development: 100+ hours of training, extensive training resources, professional certification, 3-month access, and job placement." },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <li className="h-full rounded-3xl border border-cream-300 bg-white p-7 text-center shadow-card">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-500/15">
                    <s.icon className="h-7 w-7 text-ember-600" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold text-ink-900">{s.title}</h3>
                  <p className="mt-2 text-[15px] text-slate-600">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal>
            <div className="mt-10 rounded-3xl bg-ink-900 px-6 py-8 text-center sm:px-12">
              <p className="text-lg font-bold text-white">
                Here you are! Let&apos;s get you started —{" "}
                <span className="text-ember-400">
                  Basic Nanny Training
                </span>{" "}
                and{" "}
                <span className="text-ember-400">
                  Professional Nanny Training: Coming soon
                </span>
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-7 py-3 font-bold text-white shadow-ember transition hover:bg-ember-600"
                >
                  Make Inquiry <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard/nanny/training"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-7 py-2.5 font-bold text-white transition hover:border-white hover:bg-white/10"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="bg-cream-100 pb-20">
        <CtaBand
          title="Become a World-Class Nanny"
          sub="Join a community of dedicated nannies and take the first step towards a fulfilling and impactful career."
          primary={{ label: "Make Inquiry", href: "/contact" }}
        />
      </div>
    </>
  );
}
