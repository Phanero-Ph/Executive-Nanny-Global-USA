import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { BLOG_POSTS } from "@/data/site";
import { PageHero, CtaBand } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "Nanny & Childcare Advice for New Jersey Families",
  description:
    "Practical guidance for New Jersey families on nanny hiring, childcare costs, babysitting, safety, and preparing for in-home care.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Family Resources"
        title="Nanny & Childcare Advice for New Jersey Families"
        sub="Explore practical guides to choosing a nanny, planning childcare costs, preparing your home, and keeping children safe."
      />

      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 70}>
                <article className="flex h-full flex-col rounded-3xl border border-cream-300 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-lg sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-wider text-ember-600">{post.category}</p>
                  <h2 className="mt-3 text-xl font-extrabold leading-snug text-ink-900">
                    <Link href={`/blog/${post.slug}`} className="hover:text-ember-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 leading-relaxed text-slate-600">{post.excerpt}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
                    <span>{post.date}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" />{post.readTime}</span>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-2 font-bold text-ember-600 hover:underline">
                    Read article <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-cream-100 pb-20">
        <CtaBand
          title="Looking for childcare in New Jersey?"
          sub="Learn about our nanny placement, babysitting, and backup-care services."
          primary={{ label: "Explore Services", href: "/services" }}
          secondary={{ label: "Contact Our Team", href: "/contact" }}
        />
      </div>
    </>
  );
}
