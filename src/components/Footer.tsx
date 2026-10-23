import Link from "next/link";
import { PublicImage as Image } from "@/components/PublicImage";
import { Phone, Mail, MapPin, ShieldCheck, HeartPulse, Star } from "lucide-react";
import { SITE } from "@/data/site";

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "FAQ", href: "/faqs" },
  { label: "Contact Us", href: "/contact" },
];
const IMPORTANT_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Training", href: "/training" },
  { label: "Blog", href: "/blog" },
];
const footerLink = "inline-block rounded-sm text-sm leading-6 text-teal-mist/80 transition-colors hover:text-ember-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-400";
const contactIcon = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ember-400";

export function Footer() {
  return (
    <footer id="site-footer" className="scroll-mt-20 border-t border-white/10 bg-ink-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16 lg:px-8 lg:py-16">
        <div className="min-w-0">
          <Link href="/" aria-label="Executive Global Nanny — home" className="inline-flex max-w-full items-center rounded-xl bg-cream-100 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-400">
            <Image src="/navigation-logo.png" alt="Executive Global Nanny" width={880} height={240} className="h-auto w-64 max-w-full" />
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-7 text-teal-mist/75">
            Empowering families with exceptional childcare solutions tailored to their unique needs. Fostering a nurturing environment where children can thrive.
          </p>

        </div>

        <div className="grid min-w-0 gap-x-8 gap-y-10 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.9fr_1fr] lg:border-t-0 lg:pt-1">
          <nav aria-labelledby="footer-company-heading">
            <h2 id="footer-company-heading" className="footer-heading text-xs text-ember-400 uppercase">Company Profile</h2>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map((item) => (
                <li key={item.href}><Link href={item.href} className={footerLink}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-important-heading">
            <h2 id="footer-important-heading" className="footer-heading text-xs text-ember-400 uppercase">Important Links</h2>
            <ul className="mt-5 space-y-3">
              {IMPORTANT_LINKS.map((item) => (
                <li key={item.href}><Link href={item.href} className={footerLink}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="footer-heading text-xs text-ember-400 uppercase">Contact Information</h2>
          <address className="mt-5 grid gap-x-5 gap-y-4 text-sm not-italic">
            <a href={SITE.phoneHref} className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-400">
              <span className={contactIcon}><Phone className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block text-[11px] leading-5 text-teal-mist/65">Call us</span><span className="block whitespace-nowrap font-medium text-white transition-colors group-hover:text-ember-400">908-505-5484</span></span>
            </a>
            <div className="flex min-w-0 items-center gap-3">
              <span className={contactIcon}><MapPin className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block text-[11px] leading-5 text-teal-mist/65">Based in</span><span className="block leading-5 text-teal-mist/90">Branchburg, New Jersey</span></span>
            </div>
            <a href={`mailto:${SITE.email}`} className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-400">
              <span className={contactIcon}><Mail className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block text-[11px] leading-5 text-teal-mist/65">Email us</span><span className="block leading-5 font-medium text-white transition-colors [overflow-wrap:anywhere] group-hover:text-ember-400">{SITE.email}</span></span>
            </a>
          </address>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 text-xs text-teal-mist/70 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-ember-400" aria-hidden="true" />Background-checked caregivers</span>
          <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-ember-400" aria-hidden="true" />CPR/First Aid verified</span>
          <span className="flex items-center gap-2"><Star className="h-4 w-4 text-ember-400" aria-hidden="true" />90-day placement guarantee</span>
        </div>
      </div>
      <div className="bg-ink-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-5 text-center text-xs leading-5 text-teal-mist/55 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>© 2026 {SITE.name} LLC. All rights reserved.</p>
          <p>Empowering Families, Transforming Lives</p>
        </div>
      </div>
    </footer>
  );
}
