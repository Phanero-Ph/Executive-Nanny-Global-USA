"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/data/site";
import { cn } from "@/lib/utils";

type MeResponse = { user: { id: string; name: string; email: string; role: string; requiresVerification?:boolean } | null };

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [me, setMe] = useState<MeResponse["user"]>(null);

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

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      setMe(null);
      window.location.href = "/";
    }
  };
  const dashboardHref = me?.requiresVerification?"/verify-email":me?.role === "admin" ? "/dashboard/admin" : me?.role === "nanny" ? "/dashboard/nanny" : "/dashboard/family";
  const linkStyle = "whitespace-nowrap text-base font-medium text-ink-900 transition-colors duration-200 hover:text-ember-500";
  const buttonStyle = "whitespace-nowrap rounded-full px-6 py-2.5 text-center text-base font-semibold text-white transition-all duration-300";

  const accountLinks = () => me ? (
    <>
      <Link href={dashboardHref} className={linkStyle}>{me.requiresVerification?"Verify email":"My Dashboard"}</Link>
      <button type="button" onClick={logout} className={linkStyle}>Log out</button>
    </>
  ) : (
    <Link href="/login" className={cn(linkStyle, "font-semibold")}>Login</Link>
  );

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300", scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-cream-100")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Executive Global Nanny — home">
              <Image src="/navigation-logo.png" alt="Executive Global Nanny" width={880} height={240} priority className="h-12 w-auto sm:h-14 2xl:h-16" />
            </Link>
            <nav aria-label="Primary" className="flex basis-full flex-wrap items-center justify-center gap-x-3 gap-y-3 lg:basis-auto lg:flex-1 lg:flex-nowrap lg:justify-end lg:gap-x-2 xl:gap-x-3 2xl:gap-x-4">
              {NAV.primary.map((item) => (
                <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={cn(linkStyle, "text-sm xl:text-base")}>{item.label}</Link>
              ))}
              <Link href="/find-nanny" className={cn(buttonStyle, "bg-ink-900 shadow-md hover:bg-ink-800 hover:shadow-lg px-3 py-2 text-sm 2xl:px-5")}>Find Nanny</Link>
              <Link href="/apply" className={cn(buttonStyle, "bg-ember-500 shadow-md hover:bg-ember-600 hover:shadow-lg px-3 py-2 text-sm 2xl:px-5")}>I&apos;m a Nanny</Link>
              {accountLinks()}
            </nav>
          </div>
        </div>
    </header>
  );
}
