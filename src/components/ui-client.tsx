"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stars } from "./ui";
import type { Testimonial, Faq } from "@/data/site";

/* ------------------------------ Scroll reveal ------------------------------ */

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/* ------------------------------- FAQ accordion ------------------------------ */

export function FaqAccordion({ faqs, defaultOpen = 0 }: { faqs: Faq[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white transition-all duration-200",
              isOpen ? "border-ember-300 shadow-card" : "border-cream-300 hover:border-ember-200 hover:shadow-card",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            >
              <span className="text-[15px] font-bold text-ink-900 sm:text-base">{faq.q}</span>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                  isOpen ? "rotate-180 bg-ember-500 text-white" : "bg-cream-200 text-ink-900",
                )}
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
            <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 leading-relaxed text-slate-600 sm:px-6">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------- Testimonial carousel --------------------------- */

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(t);
  }, [paused, testimonials.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + testimonials.length) % testimonials.length);
  const visible = [testimonials[index % testimonials.length]];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {testimonials.map((t, i) => (
            <figure key={i} className="w-full shrink-0 px-1">
              <div className="mx-auto max-w-3xl rounded-3xl border border-cream-300 bg-white p-8 shadow-card sm:p-10">
                <Quote className="h-8 w-8 text-ember-500" aria-hidden="true" />
                <blockquote className="mt-4 text-lg leading-relaxed font-medium text-ink-900 sm:text-xl">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-ink-900">{t.name}</div>
                    <div className="text-sm text-slate-500">
                      {t.location} · {t.role}
                    </div>
                  </div>
                  <Stars rating={t.rating} />
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-ink-900 shadow-sm transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-ember-500" : "w-2.5 bg-sand-300 hover:bg-ember-300",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-ink-900 shadow-sm transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only" aria-hidden="true">
        {visible.length}
      </span>
    </div>
  );
}
