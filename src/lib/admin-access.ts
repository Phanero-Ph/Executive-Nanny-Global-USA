import {redirect} from "next/navigation";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {adminCan} from "./admin-permissions";
import type {AdminPermission} from "./admin-permission-catalog";
export async function requireAdmin(permission?:AdminPermission){const user=await getCurrentUser();if(!user)redirect("/login");if(user.role!=="admin")redirect(`/dashboard/${user.role}`);if(permission&&!await adminCan(user,permission))redirect("/dashboard/admin?access=restricted");return user;}
