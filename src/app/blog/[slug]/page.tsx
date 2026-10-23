import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, UserRound, PhoneCall } from "lucide-react";
import { BLOG_POSTS, postBySlug, SITE } from "@/data/site";
import { PageHero, CtaBand, JsonLd } from "@/components/ui";
import { Reveal } from "@/components/ui-client";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return { title: "Article Not Found" };
  return { title: post.title, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: post.image,
          author: { "@type": "Organization", name: post.author },
          publisher: {
            "@type": "Organization",
            name: "Executive Global Nanny LLC",
            logo: { "@type": "ImageObject", url: "https://executiveglobalnannyusa.com/favicon.svg" },
          },
          datePublished: post.date,
        }}
      />
      <PageHero
        eyebrow={`${post.category} · ${post.readTime}`}
        title={post.title}
        sub={`${post.author} · ${post.date}`}
      />

      <article className="bg-cream-100 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-card">
              <Image src={post.image} alt={post.title} width={1200} height={700} unoptimized className="aspect-[16/9] w-full object-cover" />
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-8 space-y-8">
              {post.sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{section.heading}</h2>
                  )}
                  <div className="mt-3 space-y-4 text-[17px] leading-relaxed text-slate-700">
                    {section.paragraphs.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-10 flex items-center gap-4 rounded-3xl border border-cream-300 bg-white p-6 shadow-card">
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-ink-900 p-3">
                <UserRound className="h-6 w-6 text-ember-400" aria-hidden="true" />
              </span>
              <div>
                <p className="font-extrabold text-ink-900">{post.author}</p>
                <p className="text-sm text-slate-500">
                  The EGN team supports NJ families and caregivers from our Branchburg headquarters.{" "}
                  <a href={SITE.phoneHref} className="font-bold text-ember-600 hover:underline">
                    {SITE.phone}
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-8 flex items-center justify-between">
              <Link href="/blog" className="inline-flex items-center gap-2 font-bold text-ink-900 hover:text-ember-600">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All articles
              </Link>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                <Clock3 className="h-4 w-4" aria-hidden="true" /> {post.readTime}
              </span>
            </div>
          </Reveal>
        </div>
      </article>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-extrabold text-ink-900">Keep reading</h2>
          </Reveal>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {related.map((r, i) => (
              <Reveal key={r.slug} delay={i * 90}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="group grid h-full overflow-hidden rounded-3xl border border-cream-300 bg-cream-100 transition hover:-translate-y-1 hover:shadow-card-lg sm:grid-cols-2"
                >
                  <div className="overflow-hidden">
                    <Image
                      src={r.image}
                      unoptimized
                      alt={r.title}
                      width={600}
                      height={400}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold tracking-wider text-ember-600 uppercase">{r.category}</span>
                    <h3 className="mt-2 leading-snug font-extrabold text-ink-900">{r.title}</h3>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-ember-600">
                      Read <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-white pb-20">
        <CtaBand
          title="Questions this article didn't answer?"
          sub={`Call ${SITE.phone} — a real human picks up.`}
          primary={{ label: "Find a Nanny", href: "/find-nanny" }}
          secondary={{ label: "Contact Us", href: "/contact" }}
        />
      </div>
    </>
  );
}
