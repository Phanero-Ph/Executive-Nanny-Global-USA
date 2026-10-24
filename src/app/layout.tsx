import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/data/site";
import { PublicChrome } from "@/components/PublicChrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://executiveglobalnannyusa.com"),
  title: {
    default: "Executive Global Nanny | Professional Nanny & Childcare Services in Branchburg, NJ",
    template: "%s | Executive Global Nanny",
  },
  description:
    "Executive Global Nanny provides professional nanny placement, babysitting services, and backup childcare in Branchburg and throughout New Jersey. CPR-certified, background-checked nannies and babysitters for busy families.",
  keywords: [
    "nanny services New Jersey",
    "babysitting Branchburg NJ",
    "childcare Somerset County",
    "nanny agency NJ",
    "professional nannies",
    "CPR certified babysitters",
    "full-time nanny placement",
    "backup childcare New Jersey",
    "after school care NJ",
    "newborn care specialist NJ",
  ],
  authors: [{ name: "Executive Global Nanny LLC" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Executive Global Nanny",
    title: "Executive Global Nanny | Professional Nanny Services in Branchburg, NJ",
    description:
      "Trusted childcare solutions in New Jersey. Professional nanny placement, babysitting services, and backup care with vetted, CPR-certified nannies and babysitters.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Executive Global Nanny | Professional Nanny Services in Branchburg, NJ",
    description: "Trusted childcare solutions in New Jersey. Professional nanny placement, babysitting services, and backup care.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
  other: {
    "geo.region": "US-NJ",
    "geo.placename": "Branchburg, New Jersey",
    "geo.position": "40.5618;-74.7102",
    ICBM: "40.5618, -74.7102",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/graphik-regular.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/boing-semibold.woff" as="font" type="font/woff" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-cream-100 font-sans text-slate-800 antialiased">
        <PublicChrome><Header /></PublicChrome>
        <main>{children}</main>
        <PublicChrome><Footer /></PublicChrome>
      </body>
    </html>
  );
}
