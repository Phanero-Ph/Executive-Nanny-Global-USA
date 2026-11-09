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
    default: "Nanny & Babysitting Services in New Jersey | Executive Global Nanny",
    template: "%s | Executive Global Nanny",
  },
  description:
    "Find nanny placement, babysitting, and backup childcare with Executive Global Nanny. Based in Branchburg, NJ, serving families statewide and across the U.S.",
  authors: [{ name: "Executive Global Nanny LLC" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Executive Global Nanny",
    url: "https://executiveglobalnannyusa.com",
    title: "Nanny & Babysitting Services in New Jersey",
    description:
      "Nanny placement, babysitting, and backup care for New Jersey families, with services available across the United States.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nanny & Babysitting Services in New Jersey | Executive Global Nanny",
    description: "Nanny placement, babysitting, and backup care for New Jersey families and households across the United States.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
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
