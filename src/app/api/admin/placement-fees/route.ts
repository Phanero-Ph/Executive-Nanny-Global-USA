import {getCurrentUser} from "@/lib/auth";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {adminCan} from "@/lib/admin-permissions";
import {savePlacementQuote} from "@/lib/placement-quotes";
import {PlacementError} from "@/lib/placement-policy";
export async function POST(req:Request){if(!isAllowedRequestOrigin(req))return Response.json({error:"Request origin not allowed."},{status:403});const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(!await adminCan(actor,"payments.manage"))return Response.json({error:"Payment management permission required."},{status:403});const body=await req.json().catch(()=>null);if(!body||typeof body!=="object")return Response.json({error:"Enter valid quote details."},{status:400});try{return Response.json(await savePlacementQuote(actor.id,body));}catch(e){return Response.json({error:e instanceof PlacementError?e.message:"Unable to save the placement quote."},{status:e instanceof PlacementError?e.status:500});}}
