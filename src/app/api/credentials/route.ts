import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {mkdir,writeFile,unlink} from "node:fs/promises";
import path from "node:path";
import {and,eq,sql} from "drizzle-orm";
import {db} from "@/db";
import {users,caregiverCredentials,credentialEvents,mailJobs} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {CREDENTIAL_KINDS} from "@/lib/credentials";
import {appUrl} from "@/lib/mail";
export const runtime="nodejs";
export async function POST(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role==="admin"&&!await adminCan(actor,"credentials.review"))return Response.json({error:"Permission required."},{status:403});if(!["nanny","admin"].includes(actor.role))return NextResponse.json({error:"Caregiver or administrator access required."},{status:403});
 let newFile:string|undefined;
 try{
 const upload=actor.role==="nanny";
 if(upload&&!req.headers.get("content-type")?.startsWith("multipart/form-data"))return NextResponse.json({error:"Upload a document using the caregiver form."},{status:400});
 if(upload&&Number(req.headers.get("content-length"))>12*1024*1024)return NextResponse.json({error:"PDF must be under 10 MB."},{status:400});
 const form=upload?await req.formData():null,body=upload?Object.fromEntries(form!.entries()):await req.json();
 const revision=upload?Number(body.revision):body.revision;
 if(!Number.isInteger(revision)||revision<0||upload&&!Object.hasOwn(CREDENTIAL_KINDS,String(body.kind))||!upload&&(typeof body.id!=="string"||!["verify","reject","revoke"].includes(body.action)||typeof body.feedback!=="string"||body.feedback.length>2000||typeof body.note!=="string"||body.note.length>2000))return NextResponse.json({error:"Invalid credential request."},{status:400});
 if(!upload&&!body.note.trim())return NextResponse.json({error:"Record internal verification evidence or a review reason."},{status:400});
 if(!upload&&body.action!=="verify"&&!body.feedback.trim())return NextResponse.json({error:"Explain which document needs updating."},{status:400});
 if(!upload&&body.action==="verify"&&(typeof body.expiresOn!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(body.expiresOn)||Number.isNaN(Date.parse(body.expiresOn))||new Date(body.expiresOn).toISOString().slice(0,10)!==body.expiresOn||body.expiresOn<new Date().toISOString().slice(0,10)))return NextResponse.json({error:"Provide a valid current or future expiry date."},{status:400});
 let file:File|undefined;
 if(upload){const value=form!.get("file");if(!(value instanceof File)||!value.size||value.size>10*1024*1024||value.type!=="application/pdf")return NextResponse.json({error:"Upload a PDF under 10 MB."},{status:400});file=value;const bytes=Buffer.from(await file.arrayBuffer());if(bytes.subarray(0,5).toString()!=="%PDF-")return NextResponse.json({error:"Upload a valid PDF."},{status:400});newFile=randomUUID()+".pdf";await mkdir(path.join(process.cwd(),".data","credentials"),{recursive:true});await writeFile(path.join(process.cwd(),".data","credentials",newFile),bytes,{flag:"wx"});}
 const [snapshot]=upload?[]:await db.select().from(caregiverCredentials).where(eq(caregiverCredentials.id,body.id));
 if(!upload&&!snapshot)return NextResponse.json({error:"Document not found."},{status:404});
 const result=await db.transaction(async tx=>{
 const [owner]=await tx.select().from(users).where(eq(users.id,upload?actor.id:snapshot!.userId)).for("update");if(owner?.role!=="nanny")return{status:409,error:"Caregiver account unavailable."};
 const [record]=await tx.select().from(caregiverCredentials).where(upload?and(eq(caregiverCredentials.userId,actor.id),eq(caregiverCredentials.kind,String(body.kind))):eq(caregiverCredentials.id,body.id)).for("update");
 if((record?.revision??0)!==revision)return{status:409,error:"This document changed. Refresh before saving."};
 let id=record?.id;
 if(upload){const values={fileName:path.basename(file!.name).replace(/[\r\n]/g,"").slice(0,255),storedName:newFile!,status:"pending",expiresOn:null,feedback:null,reviewedAt:null,reviewedBy:null};if(record)await tx.update(caregiverCredentials).set({...values,revision:sql`${caregiverCredentials.revision}+1`}).where(eq(caregiverCredentials.id,record.id));else{const [created]=await tx.insert(caregiverCredentials).values({...values,userId:actor.id,kind:String(body.kind),revision:1}).$returningId();id=created.id;}}
 else{if(!record)return{status:404,error:"Document not found."};await tx.update(caregiverCredentials).set({status:body.action==="verify"?"verified":body.action==="reject"?"rejected":"revoked",expiresOn:body.action==="verify"?body.expiresOn:record.expiresOn,feedback:body.feedback.trim()||null,reviewedBy:actor.id,reviewedAt:new Date(),revision:sql`${caregiverCredentials.revision}+1`}).where(eq(caregiverCredentials.id,record.id));}
 await tx.insert(credentialEvents).values({credentialId:id!,actorId:actor.id,action:upload?"uploaded":body.action,note:upload?(record?JSON.stringify({replacedFile:record.storedName,previousStatus:record.status,previousExpiry:record.expiresOn}):null):JSON.stringify({evidence:body.note.trim(),document:record!.storedName,expiresOn:body.action==="verify"?body.expiresOn:record!.expiresOn})});
 const recipients=upload?await tx.select().from(users).where(eq(users.role,"admin")):[owner];for(const recipient of recipients){if(recipient.role==="admin"&&!await adminCan(recipient,"credentials.view",tx))continue;await tx.insert(mailJobs).values({userId:recipient.id,recipient:recipient.email,subject:`Credential update ${id}`,body:`A caregiver document needs attention. View your dashboard: ${appUrl(recipient.role==="admin"?"/dashboard/admin/credentials":"/dashboard/nanny/credentials")}`});}
 return{status:200,id};
 },{isolationLevel:"read committed"});
 if(result.status!==200&&newFile){await unlink(path.join(process.cwd(),".data","credentials",newFile));newFile=undefined;}
 return NextResponse.json(result.status===200?{ok:true,id:result.id}:{error:result.error},{status:result.status});
 }catch{if(newFile){const [retained]=await db.select({id:caregiverCredentials.id}).from(caregiverCredentials).where(eq(caregiverCredentials.storedName,newFile)).catch(()=>[{id:"unknown"}]);if(!retained)await unlink(path.join(process.cwd(),".data","credentials",newFile)).catch(()=>{});}return NextResponse.json({error:"Unable to save document."},{status:500});}
}
