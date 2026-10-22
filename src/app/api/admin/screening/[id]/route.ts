import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {applicationScreenings,nannyApplications,reviewEvents} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {parseApplication} from "@/lib/application-data";
import {applicationDigest,SCREENING_CHECKS, type ReferenceReview} from "@/lib/screening-policy";
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});if(user.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(user,"nannies.approve"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 try{
  const {id}=await params,body=await req.json();
  const background=body.backgroundCheck;
  const validDate=(value:unknown)=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  if(!Number.isInteger(body.revision)||typeof body.digest!=="string"||!body.checks||typeof body.checks!=="object"||!Object.keys(SCREENING_CHECKS).every(key=>typeof body.checks[key]==="boolean")||!background||!(["pending","clear","needs_follow_up"].includes(background.status))||typeof background.evidence!=="string"||background.evidence.length>2000||background.status!=="pending"&&!background.evidence.trim()||background.status==="clear"&&(!validDate(background.completedOn)||!validDate(background.expiresOn)||background.completedOn>new Date().toISOString().slice(0,10)||background.expiresOn<new Date().toISOString().slice(0,10))||!Array.isArray(body.references)||body.references.length>20||!body.references.every((r:ReferenceReview)=>r&&["pending","verified","failed"].includes(r.status)&&typeof r.note==="string"&&r.note.length<=2000&&(r.status==="pending"||r.note.trim())))return NextResponse.json({error:"Record the agency background check outcome and evidence, complete every screening check, and provide evidence for each verified reference."},{status:400});
  const outcome=await db.transaction(async tx=>{
   const [app]=await tx.select().from(nannyApplications).where(eq(nannyApplications.id,id)).for("update");if(!app)return 404;
   const data=parseApplication(app.bio);if(!data||data.references.length!==body.references.length)return 400;
   const [previous]=await tx.select().from(applicationScreenings).where(eq(applicationScreenings.applicationId,id));
   if((previous?.revision??-1)!==body.revision||applicationDigest(app.bio)!==body.digest)return 409;
   if(["active","placed"].includes(app.status)&&previous?.applicationDigest===applicationDigest(app.bio)){
    // Approved/placed applications keep their original screening decisions locked, but
    // admins must still be able to renew the agency-owned background-check record.
    let savedChecks:Record<string,unknown>={};let savedReferences:unknown[]=[];
    try{savedChecks=previous?JSON.parse(previous.checks):{};savedReferences=previous?JSON.parse(previous.referenceReviews):[];}catch{return 409;}
    const submittedChecks=Object.fromEntries(Object.keys(SCREENING_CHECKS).map(key=>[key,body.checks[key]]));
    const priorChecks=Object.fromEntries(Object.keys(SCREENING_CHECKS).map(key=>[key,savedChecks[key]===true]));
    if(JSON.stringify(submittedChecks)!==JSON.stringify(priorChecks)||JSON.stringify(body.references)!==JSON.stringify(savedReferences))return 423;
   }
   const values={applicationDigest:body.digest,checks:JSON.stringify({...Object.fromEntries(Object.keys(SCREENING_CHECKS).map(key=>[key,body.checks[key]])),backgroundCheckStatus:background.status,backgroundCheckCompletedOn:background.completedOn,backgroundCheckExpiresOn:background.expiresOn,backgroundCheckEvidence:background.evidence.trim()}),referenceReviews:JSON.stringify(body.references),revision:(previous?.revision??-1)+1,reviewedBy:user.id,updatedAt:new Date()};
   if(previous)await tx.update(applicationScreenings).set(values).where(eq(applicationScreenings.applicationId,id));else await tx.insert(applicationScreenings).values({...values,applicationId:id});
   const completedChecks=Object.values(body.checks as Record<string,boolean>).filter(Boolean).length;
   const verifiedReferences=(body.references as ReferenceReview[]).filter(reference=>reference.status==="verified").length;
   const backgroundDates=background.status==="pending"?"":` (completed ${background.completedOn}; expires ${background.expiresOn})`;
   const note=`Screening review updated: ${completedChecks}/${Object.keys(SCREENING_CHECKS).length} checklist items complete; background check ${String(background.status).replaceAll("_"," ")}${backgroundDates}; ${verifiedReferences}/${body.references.length} references verified.${background.evidence.trim()?` Agency note: ${background.evidence.trim()}`:""}`;
   await tx.insert(reviewEvents).values({reviewerId:user.id,nannyApplicationId:id,fromStatus:app.status,toStatus:app.status,note});return 200;
  });
  return outcome===200?NextResponse.json({ok:true}):NextResponse.json({error:outcome===404?"Application not found.":outcome===409?"The application changed. Refresh before saving.":outcome===423?"Move this candidate back to screening before editing. Resolve active placements first.":"Application references do not match this review."},{status:outcome});
 }catch{return NextResponse.json({error:"Could not save screening."},{status:500});}
}
