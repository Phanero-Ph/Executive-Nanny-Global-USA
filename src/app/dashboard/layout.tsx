import {AdminPermissionsProvider} from "@/components/AdminPermissions";
import {getAdminGrant} from "@/lib/admin-permissions";
import {ChatAccessProvider} from "@/components/ChatAccess";
import {getChatSettings} from "@/lib/chat-settings";
import {hasPaidFamilyMembership} from "@/lib/family-membership";
import {FamilySubscriptionNotice} from "@/components/FamilySubscriptionNotice";
import {redirect} from "next/navigation";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {DashboardShell} from "@/components/DashboardShell";
import {FamilyPlacementFeeNotice} from "@/components/FamilyPlacementFeeNotice";
import {getRequestFees} from "@/lib/agency-fees";
import {db} from "@/db";
import {familyRequests} from "@/db/schema";
import {and,eq,notInArray} from "drizzle-orm";
import {getDashboardAttentionCounts} from "@/lib/dashboard-attention";
export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false}};
export default async function DashboardLayout({children}:{children:React.ReactNode}){const user=await getCurrentUser();if(!user)redirect("/login");if(!["family","nanny","admin"].includes(user.role))redirect("/");const [familySubscribed,chat,grant,attentionCounts]=await Promise.all([user.role==="family"?hasPaidFamilyMembership(user.id):false,getChatSettings(),user.role==="admin"?getAdminGrant(user.id):null,getDashboardAttentionCounts(user.id,user.role)]);const placementNotice= user.role==="family"?await (async()=>{const requests=await db.select({id:familyRequests.id,status:familyRequests.status}).from(familyRequests).where(and(eq(familyRequests.userId,user.id),eq(familyRequests.careCategory,"caregiver"),notInArray(familyRequests.status,["closed","cancelled"])));const items=(await Promise.all(requests.map(async request=>{const fees=await getRequestFees(request.id);return{...request,fees};}))).filter(item=>item.fees.placementStatus!=="paid").map(item=>({id:item.id,rate:item.fees.placementRateBps,amount:item.fees.placementCents,salary:item.fees.annualSalaryCents}));return <FamilyPlacementFeeNotice items={items}/>;})():null;const subscriptionNotice=user.role==="family"?<FamilySubscriptionNotice userId={user.id} subscribed={familySubscribed}/>:undefined;return <AdminPermissionsProvider role={user.role} initial={grant}><ChatAccessProvider initial={chat} role={user.role}><DashboardShell familySubscribed={familySubscribed} attentionCounts={attentionCounts} notice={placementNotice} subscriptionNotice={subscriptionNotice} user={{name:user.name,email:user.email,role:user.role}}>{children}</DashboardShell></ChatAccessProvider></AdminPermissionsProvider>;}
