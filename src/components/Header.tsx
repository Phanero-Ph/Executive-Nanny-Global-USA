"use client";

import { useEffect, useRef, useState } from "react";
import { PublicImage as Image } from "@/components/PublicImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV } from "@/data/site";
import { cn } from "@/lib/utils";

type MeResponse = { user: { id: string; name: string; email: string; role: string; requiresVerification?: boolean } | null };

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const mobileNav = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MeResponse | null) => { if (active) setMe(d?.user ?? null); })
      .catch(() => { if (active) setMe(null); });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    mobileNav.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      setMe(null);
      setMenuOpen(false);
      window.location.href = "/";
    }
  };

  const dashboardHref = me?.requiresVerification ? "/verify-email" : me?.role === "admin" ? "/dashboard/admin" : me?.role === "nanny" ? "/dashboard/nanny" : "/dashboard/family";
  const linkStyle = "whitespace-nowrap text-sm font-medium text-ink-900 transition-colors duration-200 hover:text-ember-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-brand";
  const buttonStyle = "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors";

  const accountLinks = (mobile = false) => {
    const mobileStyle = mobile ? "min-h-11 justify-start rounded-xl px-3 text-base" : "";
    return me ? (
      <>
        <Link href={dashboardHref} onClick={mobile ? () => setMenuOpen(false) : undefined} className={cn(linkStyle, mobileStyle)}>{me.requiresVerification ? "Verify email" : "My Dashboard"}</Link>
        <button type="button" onClick={logout} className={cn(linkStyle, mobileStyle, "text-left")}>Log out</button>
      </>
    ) : (
      <Link href="/login" onClick={mobile ? () => setMenuOpen(false) : undefined} className={cn(linkStyle, "font-semibold", mobileStyle)}>Login</Link>
    );
  };

  return (
    <header className={cn("sticky top-0 z-50 transition-colors duration-300", scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-cream-100")}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4 py-2 xl:min-h-[84px]">
          <Link href="/" className="flex min-w-0 shrink items-center" aria-label="Executive Global Nanny — home">
            <Image src="/navigation-logo.png" alt="Executive Global Nanny" width={880} height={240} priority className="h-11 w-auto max-w-[min(65vw,260px)] object-contain sm:h-12 xl:h-14" />
          </Link>

          <nav aria-label="Primary navigation" className="hidden min-w-0 items-center justify-end gap-3 xl:flex 2xl:gap-5">
            {NAV.primary.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={linkStyle}>{item.label}</Link>)}
            <Link href="/find-nanny" className={cn(buttonStyle, "bg-ink-900 shadow-sm hover:bg-ink-800")}>Find Nanny</Link>
            <Link href="/signup?role=nanny" className={cn(buttonStyle, "bg-ember-500 shadow-sm hover:bg-ember-600")}>I&apos;m a Nanny</Link>
            {accountLinks()}
          </nav>

          <button
            ref={menuButton}
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-900/10 bg-white text-ink-900 shadow-sm transition hover:border-ink-900/25 hover:bg-cream-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand xl:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-ink-950/40 xl:hidden" onClick={() => setMenuOpen(false)} />}
      <nav
        ref={mobileNav}
        id="mobile-primary-navigation"
        aria-label="Mobile primary navigation"
        aria-hidden={!menuOpen}
        className={cn("absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-72px)] flex-col overflow-y-auto overscroll-contain border-t border-cream-300 bg-white px-5 pb-6 pt-4 shadow-xl xl:hidden", menuOpen ? "flex" : "hidden")}
      >
        <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Explore</span>
          <button type="button" onClick={() => setMenuOpen(false)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-ink-900" aria-label="Close navigation menu">
            Close <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-1">
          {NAV.primary.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-base font-medium text-ink-900 transition hover:bg-cream-50 hover:text-teal-brand">{item.label}</Link>)}
        </div>
        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <Link href="/find-nanny" onClick={() => setMenuOpen(false)} className={cn(buttonStyle, "bg-ink-900 hover:bg-ink-800")}>Find Nanny</Link>
          <Link href="/signup?role=nanny" onClick={() => setMenuOpen(false)} className={cn(buttonStyle, "bg-ember-500 hover:bg-ember-600")}>I&apos;m a Nanny</Link>
        </div>
        <div className="mt-4 grid gap-1 border-t border-slate-100 pt-3">
          {accountLinks(true)}
        </div>
      </nav>
    </header>
  );
}
