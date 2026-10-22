import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-11 w-11", className)} aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0A3D4A" />
      <circle cx="24" cy="17.5" r="5.5" fill="#FF8C42" />
      <path
        d="M10 36.5c1.8-6.6 7.4-10.4 14-10.4s12.2 3.8 14 10.4"
        stroke="#FFF5EE"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="33.5" cy="13.5" r="3.4" fill="#4DB8C4" />
    </svg>
  );
}

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Executive Global Nanny — home">
      <LogoMark className="h-11 w-11 shrink-0 transition-transform duration-300 group-hover:scale-105" />
      <span className="leading-tight">
        <span
          className={cn(
            "block text-[17px] font-extrabold tracking-tight sm:text-lg",
            dark ? "text-white" : "text-ink-900",
          )}
        >
          Executive Global Nanny
        </span>
        {!compact && (
          <span className={cn("block text-[11px] font-semibold tracking-[0.18em] uppercase", dark ? "text-ember-400" : "text-ember-600")}>
            Branchburg · New Jersey
          </span>
        )}
      </span>
    </Link>
  );
}
