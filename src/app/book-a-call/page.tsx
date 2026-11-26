import type {Metadata} from "next";
import {PhoneCall} from "lucide-react";
import {BookCallCalendar} from "@/components/BookCallCalendar";
export const metadata:Metadata={title:"Book a Call",description:"Choose an available time to speak with Executive Global Nanny about your childcare needs."};
export const dynamic="force-dynamic";
export default function BookCallPage(){return <main className="min-h-screen bg-cream-50 px-5 py-12 sm:px-8 sm:py-16"><div className="mx-auto max-w-6xl"><div className="mx-auto mb-10 max-w-2xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-ember-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-ember-700"><PhoneCall size={15}/> Talk with our team</span><h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">Book a call</h1><p className="mt-4 text-lg leading-7 text-slate-600">Choose a date and time that works for you. We’ll follow up with your meeting details.</p></div><BookCallCalendar/></div></main>;}
