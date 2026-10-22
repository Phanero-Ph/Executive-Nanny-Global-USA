import {safeUser} from "@/lib/auth";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import type { Metadata } from "next";
import { ApplicationLayout } from "@/components/ApplicationLayout";
import { NannyApplyForm } from "@/components/NannyApplyForm";
export const metadata: Metadata = { title: "Become a Nanny â€” Apply to Join Our NJ Caregiver Network", description: "Join our network of professional caregivers. Share your experience, availability, and references.", alternates: { canonical: "/apply" } };
export const dynamic = "force-dynamic";
export default async function ApplyPage() {
 const user = await getCurrentUser();
 return <ApplicationLayout kind="nanny"><NannyApplyForm account={user?.role === "nanny" ? safeUser(user) : undefined} /></ApplicationLayout>;
}
