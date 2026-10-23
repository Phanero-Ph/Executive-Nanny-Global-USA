import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, CalendarDays, TrendingUp, Tag } from "lucide-react";
import { BLOG_PAGE_POSTS } from "@/data/blog";
import { PageHero, CtaBand } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export const metadata: Metadata = {
  title: "Blog — Childcare Insights & Expert Tips",
  description:
    "Expert advice, industry news, and helpful resources for families and caregivers from Executive Global Nanny.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const featuredPosts = BLOG_PAGE_POSTS.filter((post) => post.featured);
  return (
    <>
      <PageHero
        eyebrow="Our Blog"
        title="Childcare Insights & Expert Tips"
        sub="Expert advice, industry news, and helpful resources for families and caregivers."
      />

      <section className="bg-cream-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 id="featured-articles-heading" className="flex items-center gap-3 text-3xl text-ink-900">
              <TrendingUp className="h-7 w-7 shrink-0 text-ember-500" aria-hidden="true" />
              Featured Articles
            </h2>
          </Reveal>
          <div aria-labelledby="featured-articles-heading" className="mt-10 grid gap-6 lg:grid-cols-2">
            {featuredPosts.map((post, i) => (
              <Reveal key={post.title} delay={i * 90}>
                <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-ember-100 bg-gradient-to-br from-cream-50 to-white p-6 shadow-card-lg sm:p-8">
                  <span className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-ember-500/5" aria-hidden="true" />
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-white shadow-ember">
                      <Tag className="h-4 w-4" aria-hidden="true" />{post.category}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-ember-500" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </div>
                  <h3 className="relative mt-6 text-2xl text-ink-900 sm:text-3xl">{post.title}</h3>
                  <p className="relative mt-4 flex-1 text-base leading-relaxed text-slate-600 sm:text-lg">{post.excerpt}</p>
                  <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500">
                    <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" aria-hidden="true" />{post.readTime}</span>
                    <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden="true" />{post.date}</span>
                  </div>
                  <Link href={post.href} className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ember-400 to-ember-500 px-6 py-3 font-semibold text-white shadow-ember transition hover:from-ember-500 hover:to-ember-600">
                    Read on Facebook <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_PAGE_POSTS.map((post, i) => (
              <Reveal key={post.title} delay={(i % 3) * 90}>
                <Link
                  href={post.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cream-300 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-lg"
                >
                  <div className="overflow-hidden">
                    <Image
                      src={post.image}
                      unoptimized
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

      <div className="bg-cream-100 pb-20">
        <CtaBand title="Join Our Community" sub="Connect with us on social media for childcare tips, industry insights, and updates." primary={{ label: "Facebook", href: "https://www.facebook.com/executiveglobalnanny" }} secondary={{ label: "Instagram", href: "https://www.instagram.com/executiveglobalnannyusa/" }} />
      </div>
    </>
  );
}
