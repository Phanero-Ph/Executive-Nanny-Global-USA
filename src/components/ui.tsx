import Link from "next/link";
import { Star, Baby, Clock, Sparkles, Siren, MoonStar, Briefcase, HeartPulse, Award, Smile, Salad, Puzzle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/data/site";

/* --------------------------------- Icons --------------------------------- */

const ICONS: Record<string, typeof Baby> = {
  baby: Baby,
  clock: Clock,
  sparkles: Sparkles,
  siren: Siren,
  moon: MoonStar,
  briefcase: Briefcase,
  heart: HeartPulse,
  award: Award,
  smile: Smile,
  salad: Salad,
  puzzle: Puzzle,
  shield: ShieldCheck,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={cn("h-6 w-6", className)} aria-hidden="true" />;
}

/* --------------------------------- Type ---------------------------------- */

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-[0.14em] uppercase",
        light ? "border-white/25 bg-white/10 text-ember-200" : "border-ember-200 bg-cream-200 text-ember-700",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", light ? "bg-ember-400" : "bg-ember-500")} />
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  sub,
  align = "center",
  light = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
          light ? "text-white" : "text-ink-900",
        )}
      >
        {title}
      </h2>
      {sub && <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-teal-mist/90" : "text-slate-600")}>{sub}</p>}
    </div>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type BtnProps = {
  href: string;
  children: React.ReactNode;
  variant?: "ember" | "ink" | "outline-light" | "outline-ink" | "white";
  size?: "md" | "lg" | "sm";
  className?: string;
};

export function CtaButton({ href, children, variant = "ember", size = "md", className }: BtnProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200",
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-6 py-3 text-[15px]",
        size === "lg" && "px-8 py-4 text-base",
        variant === "ember" && "bg-ember-500 text-white shadow-ember hover:-translate-y-0.5 hover:bg-ember-600",
        variant === "ink" && "bg-ink-900 text-white shadow-card hover:-translate-y-0.5 hover:bg-ink-800",
        variant === "white" && "bg-white text-ink-900 shadow-card hover:-translate-y-0.5 hover:bg-cream-100",
        variant === "outline-light" && "border-2 border-white/70 text-white hover:border-white hover:bg-white/10",
        variant === "outline-ink" && "border-2 border-ink-900/20 bg-white text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* --------------------------------- Misc ----------------------------------- */

export function Stars({ rating = 5, className }: { rating?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink-900">
      <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-ember-500/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-brand/25 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16 lg:px-8">
        <div className="max-w-3xl">
          <Eyebrow light>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-balance text-white sm:text-5xl">{title}</h1>
          {sub && <p className="mt-4 text-lg leading-relaxed text-teal-mist/90">{sub}</p>}
        </div>
      </div>
      <svg viewBox="0 0 1440 56" className="relative block w-full text-cream-100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 56h1440V28C1200 52 960 56 720 44 480 32 240 12 0 28v28Z" fill="currentColor" />
      </svg>
    </section>
  );
}

export function CtaBand({
  title = "Ready to meet your perfect caregiver?",
  sub = "Tell us what your family needs — a dedicated recruiter will respond within one business day.",
  primary = { label: "Find a Nanny", href: "/find-nanny" },
  secondary = { label: `Call ${SITE.phone}`, href: SITE.phoneHref },
}: {
  title?: string;
  sub?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center shadow-card-lg sm:px-12 sm:py-16">
        <div className="dot-grid-light absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-ember-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl">{title}</h2>
          <p className="mt-3 text-lg text-teal-mist/90">{sub}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaButton href={primary.href} size="lg">
              {primary.label}
            </CtaButton>
            <CtaButton href={secondary.href} variant="outline-light" size="lg">
              {secondary.label}
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
