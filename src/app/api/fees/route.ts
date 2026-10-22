import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {and,eq} from "drizzle-orm";
import {db} from "@/db";
import {familyRequests} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {getAgencyFees,getRequestFees} from "@/lib/agency-fees";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get("requestId");
 if(id){const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});if(user.role==="admin"&&!await adminCan(user,"payments.view"))return Response.json({error:"Permission required."},{status:403});
 const [request]=await db.select({id:familyRequests.id}).from(familyRequests).where(and(eq(familyRequests.id,id),...(user.role==="admin"?[]:[eq(familyRequests.userId,user.id)])));
 if(!request)return NextResponse.json({error:"Request not found."},{status:404});
 return NextResponse.json(await getRequestFees(id),{headers:{"Cache-Control":"private, no-store"}});}
 const {searchCents,placementRateBps}=await getAgencyFees();return NextResponse.json({searchCents,placementCents:null,placementRateBps},{headers:{"Cache-Control":"no-store"}});
}
