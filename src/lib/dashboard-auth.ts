import {redirect} from "next/navigation";
import {getCurrentUser,requiresEmailVerification} from "@/lib/auth";
export async function getDashboardUser(){const user=await getCurrentUser({allowUnverified:true});if(user&&requiresEmailVerification(user))redirect("/verify-email");return user;}
