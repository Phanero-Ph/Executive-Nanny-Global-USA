import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Heart, Phone } from "lucide-react";
import { LoginForm } from "@/components/forms";
import styles from "./login.module.css";
import { SITE } from "@/data/site";
export const metadata: Metadata = {
 title: "Log In",
 description: "Log in to your Executive Global Nanny family or nanny account.",
 robots: { index: false, follow: false },
};
export default function LoginPage() {
 return <section className={`application-page ${styles.page}`}>
  <div className={styles.container}>
   <div className={styles.topline}><span className="application-kicker">YOUR EGN ACCOUNT</span><Link href="/">Back to home <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
   <div className={styles.card}>
    <div className={styles.formPanel}>
     <div className={styles.heading}><span className={styles.icon}><Heart size={20} aria-hidden="true" /></span><h1>Welcome back.</h1></div>
     <div className={styles.form}><LoginForm /></div>
     <div className={styles.signup}><p>New to Executive Global Nanny?</p><Link href="/signup">Create an account <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    </div>
    <aside className={styles.aside}>
     <div><span className={styles.eyebrow}>CONNECTED THROUGH CARE</span><h2>A little support.<br />A world of difference.</h2><p>Your next step is closer than you think. Stay connected with our team and your childcare journey.</p><ul>{["Access your family or nanny dashboard", "Keep track of requests and applications", "Continue your journey with our team"].map(item => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul></div>
     <div className={styles.help}><p>Having trouble signing in? We&apos;re here to help.</p><a href={SITE.phoneHref}><Phone size={14} aria-hidden="true" />{SITE.phone}</a></div>
    </aside>
   </div>
  </div>
 </section>;
}
