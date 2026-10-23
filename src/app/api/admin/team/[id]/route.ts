import {deliverQueuedEmail} from "@/lib/mail";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {adminCan} from "@/lib/admin-permissions";
import {updateAdminAccess,AdminManagementError} from "@/lib/admin-management";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(!await adminCan(actor,"admins.manage"))return NextResponse.json({error:"Administrator management permission required."},{status:403});const body=await req.json().catch(()=>null);if(!body||typeof body!=="object")return NextResponse.json({error:"Choose an action."},{status:400});try{const result=await updateAdminAccess(actor,(await params).id,body);if(result.mailId)await deliverQueuedEmail(result.mailId).catch(()=>{});return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof AdminManagementError?e.message:"Could not update administrator access."},{status:e instanceof AdminManagementError?e.status:500});}}
