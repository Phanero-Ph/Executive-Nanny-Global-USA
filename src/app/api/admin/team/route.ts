import {deliverQueuedEmail} from "@/lib/mail";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {adminCan} from "@/lib/admin-permissions";
import {createAdminInvitation,AdminManagementError} from "@/lib/admin-management";
export async function POST(req:Request){if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(!await adminCan(actor,"admins.manage"))return NextResponse.json({error:"Administrator management permission required."},{status:403});const body=await req.json().catch(()=>null);if(!body||typeof body!=="object")return NextResponse.json({error:"Enter valid invitation details."},{status:400});try{const {mailId,...result}=await createAdminInvitation(actor,body);await deliverQueuedEmail(mailId).catch(()=>{});return NextResponse.json({ok:true,...result});}catch(e){return NextResponse.json({error:e instanceof AdminManagementError?e.message:"Could not create the invitation."},{status:e instanceof AdminManagementError?e.status:500});}}
