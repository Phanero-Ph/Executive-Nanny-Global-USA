import {safeUser} from "@/lib/auth";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { nannyApplications } from "@/db/schema";
import { parseApplication, EDITABLE_APPLICATION_STATUSES, type ApplicationData } from "@/lib/application-data";
import { ApplicationLayout } from "@/components/ApplicationLayout";
import { NannyApplyForm } from "@/components/NannyApplyForm";
export const metadata: Metadata = { title: "Become a Nanny â€” Apply to Join Our NJ Nanny Network", description: "Join our network of professional nannies. Share your experience, availability, and references.", alternates: { canonical: "/apply" } };
export const dynamic = "force-dynamic";
export default async function ApplyPage() {
 const user = await getCurrentUser();
 if(!user)redirect("/signup?role=nanny");
 if(user.role!=="nanny")redirect(`/dashboard/${user.role}`);
 let [application]=await db.select({id:nannyApplications.id,bio:nannyApplications.bio,status:nannyApplications.status}).from(nannyApplications).where(eq(nannyApplications.userId,user.id)).orderBy(desc(nannyApplications.createdAt),desc(nannyApplications.id)).limit(1);
 if(!application){
  const id=randomUUID();
  const initial:ApplicationData={version:1,values:{firstName:user.name.split(" ")[0]??"",lastName:user.name.split(" ").slice(1).join(" "),email:user.email,country:"United States",phone:user.phone??""},references:[],workHistory:[],languages:[],attachments:[]};
  await db.insert(nannyApplications).values({id,userId:user.id,name:user.name,email:user.email,phone:user.phone,status:"draft",subscriptionStatus:"inactive",bio:JSON.stringify(initial)});
  application={id,bio:JSON.stringify(initial),status:"draft"};
 }
 if(!EDITABLE_APPLICATION_STATUSES.includes(application.status))return <ApplicationLayout kind="nanny"><section className="mx-auto my-12 max-w-xl rounded-2xl border border-cream-300 bg-white p-7"><h1 className="text-2xl text-ink-900">Your application is already with the agency</h1><p className="mt-3 text-sm leading-6 text-slate-600">Check your dashboard for review updates or contact the agency if you need to make a change.</p><a className="application-submit mt-6" href="/dashboard/nanny">Return to your dashboard</a></section></ApplicationLayout>;
 const initial=parseApplication(application.bio);
 return <ApplicationLayout kind="nanny"><NannyApplyForm applicationId={application.id} initial={initial??undefined} account={safeUser(user)} /></ApplicationLayout>;
}
