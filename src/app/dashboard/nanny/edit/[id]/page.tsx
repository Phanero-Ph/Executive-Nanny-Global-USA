import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { nannyApplications } from "@/db/schema";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import { parseApplication, EDITABLE_APPLICATION_STATUSES } from "@/lib/application-data";
import { NannyApplyForm } from "@/components/NannyApplyForm";
export const dynamic = "force-dynamic";
export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
 const user = await getCurrentUser(); if (!user) redirect("/login"); if (user.role !== "nanny") redirect("/dashboard/family");
 const { id } = await params;
 const [application] = await db.select().from(nannyApplications).where(and(eq(nannyApplications.id,id),eq(nannyApplications.userId,user.id))).limit(1);
 if (!application) notFound();
 const data = parseApplication(application.bio);
 return <section className="application-page bg-cream-50 px-5 py-12"><div className="mx-auto max-w-3xl"><Link href="/dashboard/nanny" className="text-sm text-ink-900">← Back to dashboard</Link><div className="mt-6 overflow-hidden rounded-2xl border border-cream-300 bg-white">{data && EDITABLE_APPLICATION_STATUSES.includes(application.status) ? <><div className="border-b border-cream-300 p-6"><h1 className="text-2xl text-ink-900">Correct your application</h1><p className="mt-3 text-sm text-slate-500">Saving corrections sends your application back for review. Existing documents stay attached.</p></div><NannyApplyForm applicationId={id} initial={{ ...data, values: { ...data.values, email: user.email } }} /></> : <div className="p-8"><h1 className="text-2xl text-ink-900">Contact us to make corrections</h1><p className="mt-3 text-sm text-slate-500">Your application is already in review or uses an older format. Our team can help update it.</p><Link href="/contact" className="application-submit mt-6">Contact our team</Link></div>}</div></div></section>;
}
