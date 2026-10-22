import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {getDashboardAttentionCounts} from "@/lib/dashboard-attention";
export const dynamic="force-dynamic";
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});return NextResponse.json({counts:await getDashboardAttentionCounts(user.id,user.role)},{headers:{"Cache-Control":"private, no-store"}});}
