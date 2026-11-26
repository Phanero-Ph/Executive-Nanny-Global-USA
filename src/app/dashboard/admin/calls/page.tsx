import {requireAdmin} from "@/lib/admin-access";
import {AdminCallBookings} from "@/components/AdminCallBookings";
export const dynamic="force-dynamic";
export const metadata={title:"Call requests",robots:{index:false,follow:false}};
export default async function AdminCallsPage(){await requireAdmin("matching.manage");return <main className="application-page min-h-screen bg-cream-50 px-5 py-12 sm:px-8"><div className="mx-auto max-w-6xl"><p className="dashboard-eyebrow">CALL SCHEDULING</p><h1 className="mt-2 text-3xl font-extrabold text-ink-900">Book a Call requests</h1><p className="mt-2 max-w-2xl text-slate-600">Review requests, confirm the meeting details, and manage the times visitors can book.</p><div className="mt-8"><AdminCallBookings/></div></div></main>;}
