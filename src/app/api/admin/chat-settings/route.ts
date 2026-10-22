import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {agencyChatSettings,reviewEvents} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
export async function PATCH(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(actor,"settings.chat"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 const body=await req.json().catch(()=>null);if(!body||typeof body.familyEnabled!=="boolean"||typeof body.nannyEnabled!=="boolean"||!Number.isSafeInteger(body.revision)||body.revision<0)return NextResponse.json({error:"Choose valid family and nanny chat settings."},{status:400});
 try{const result=await db.transaction(async tx=>{
  await tx.insert(agencyChatSettings).values({id:1}).onDuplicateKeyUpdate({set:{id:1}});
  const [current]=await tx.select().from(agencyChatSettings).where(eq(agencyChatSettings.id,1)).for("update");if(current.revision!==body.revision)return null;
  const familyEnabled=body.familyEnabled?1:0,nannyEnabled=body.nannyEnabled?1:0;
  if(current.familyEnabled===familyEnabled&&current.nannyEnabled===nannyEnabled)return {revision:current.revision};
  await tx.update(agencyChatSettings).set({familyEnabled,nannyEnabled,revision:current.revision+1,updatedBy:actor.id,updatedAt:new Date()}).where(eq(agencyChatSettings.id,1));
  await tx.insert(reviewEvents).values({reviewerId:actor.id,fromStatus:"chat_settings",toStatus:"chat_settings",note:`Agency chat: families ${current.familyEnabled?"enabled":"disabled"} → ${body.familyEnabled?"enabled":"disabled"}; nannies/caregivers ${current.nannyEnabled?"enabled":"disabled"} → ${body.nannyEnabled?"enabled":"disabled"}. History retained.`});return {revision:current.revision+1};
 });return result?NextResponse.json({ok:true,...body,revision:result.revision}):NextResponse.json({error:"Chat settings changed. Refresh before saving."},{status:409});
 }catch{return NextResponse.json({error:"Unable to save chat settings."},{status:500});}
}
