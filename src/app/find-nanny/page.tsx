import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// “Find a Nanny” is the family account entry point. Families choose a service
// from their dashboard after verifying their email and signing in.
export default async function FindNannyPage() {
  const user = await getCurrentUser({allowUnverified:true});
  if (user && !user.emailVerifiedAt) redirect("/verify-email");
  if (user?.role === "family") redirect("/dashboard/family");
  if (user?.role === "nanny") redirect("/dashboard/nanny");
  if (user?.role === "admin") redirect("/dashboard/admin");
  redirect("/signup?role=family");
}
