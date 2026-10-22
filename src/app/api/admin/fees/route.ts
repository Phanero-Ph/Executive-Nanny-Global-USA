import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {agencyFeeSettings,reviewEvents} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {parseFee,parsePlacementRate} from "@/lib/fee-format";
export async function PATCH(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(actor,"settings.fees"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 try{const body=await req.json().catch(()=>null);
 if(!body||typeof body!=="object")return NextResponse.json({error:"Enter valid fee settings."},{status:400});
 const searchCents=parseFee(body.search),placementRateBps=parsePlacementRate(body.placementRate);
 if(searchCents===null||placementRateBps===null||!Number.isSafeInteger(body.revision)||body.revision<0)return NextResponse.json({error:"Enter a search fee of $0.50–$10,000 and placement rate of 0.01–100%, with up to two decimal places."},{status:400});
 const result=await db.transaction(async tx=>{
  await tx.insert(agencyFeeSettings).values({id:1}).onDuplicateKeyUpdate({set:{id:1}});
  const [current]=await tx.select().from(agencyFeeSettings).where(eq(agencyFeeSettings.id,1)).for("update");
  if(current.revision!==body.revision)return null;
  if(current.searchCents===searchCents&&current.placementRateBps===placementRateBps)return current;
  await tx.update(agencyFeeSettings).set({searchCents,placementRateBps,revision:current.revision+1,updatedBy:actor.id,updatedAt:new Date()}).where(eq(agencyFeeSettings.id,1));
  await tx.insert(reviewEvents).values({reviewerId:actor.id,fromStatus:"agency_fees",toStatus:"agency_fees",note:`Nanny fees: search ${current.searchCents} → ${searchCents}; placement basis points ${current.placementRateBps} → ${placementRateBps}. Existing issued fees retained.`});
  return {...current,searchCents,placementRateBps,revision:current.revision+1};
 });
 return result?NextResponse.json({ok:true,...result}):NextResponse.json({error:"Fees changed since you opened this page. Refresh before saving."},{status:409});
 }catch{return NextResponse.json({error:"Unable to save fees. Please try again."},{status:500});}
}
