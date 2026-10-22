import {adminCan} from "@/lib/admin-permissions";
import {randomUUID} from "node:crypto";
import {mkdir,writeFile,unlink} from "node:fs/promises";
import path from "node:path";
import {NextResponse} from "next/server";
import {eq,sql} from "drizzle-orm";
import {db} from "@/db";
import {trainingCourses,trainingLessons,trainingEvents} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
export const runtime="nodejs";
const text=(v:unknown,max:number)=>typeof v==="string"&&v.trim().length>0&&v.length<=max;
export async function POST(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(actor,"training.manage"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 let uploaded:string|undefined;let removed:string|undefined;
 try{
 let body:Record<string,unknown>,file:File|null=null;
 if(req.headers.get("content-type")?.includes("multipart/form-data")){if(Number(req.headers.get("content-length"))>12*1024*1024)return NextResponse.json({error:"Upload is too large."},{status:400});const form=await req.formData();body=Object.fromEntries(form.entries());body.revision=Number(body.revision);file=form.get("file") instanceof File?form.get("file") as File:null;}
 else body=await req.json();
 if(!body||!["create","update","lesson","delete_lesson","publish","archive"].includes(String(body.action)))return NextResponse.json({error:"Invalid training action."},{status:400});
 if(["create","update"].includes(String(body.action))&&(!text(body.title,200)||!text(body.summary,5000)||!text(body.instructor,200)||!text(body.duration,100)))return NextResponse.json({error:"Enter a course title, summary, instructor and duration."},{status:400});
 if(body.action!=="create"&&(typeof body.courseId!=="string"||!Number.isInteger(body.revision)))return NextResponse.json({error:"Invalid course update."},{status:400});
 let pdf:Buffer|undefined;
 if(body.action==="lesson"){
 if(!text(body.title,200)||typeof body.content!=="string"||body.content.length>50000)return NextResponse.json({error:"Enter a lesson title and content under 50,000 characters."},{status:400});
 if(file&&file.size>0){if(file.size>10*1024*1024||file.type!=="application/pdf")return NextResponse.json({error:"Upload a PDF of up to 10 MB."},{status:400});pdf=Buffer.from(await file.arrayBuffer());if(pdf.subarray(0,5).toString()!=="%PDF-")return NextResponse.json({error:"The material must be a valid PDF file."},{status:400});}
 if(!body.content.trim()&&!pdf)return NextResponse.json({error:"Add lesson content or a PDF material."},{status:400});
 }
 const result=await db.transaction(async tx=>{
 if(body.action==="create"){const [created]=await tx.insert(trainingCourses).values({title:String(body.title).trim(),summary:String(body.summary).trim(),instructor:String(body.instructor).trim(),duration:String(body.duration).trim(),createdBy:actor.id}).$returningId();await tx.insert(trainingEvents).values({courseId:created.id,actorId:actor.id,action:"created"});return{status:200,id:created.id};}
 const [course]=await tx.select().from(trainingCourses).where(eq(trainingCourses.id,String(body.courseId))).for("update");if(!course)return{status:404,error:"Course not found."};if(course.revision!==body.revision)return{status:409,error:"This course changed. Refresh before saving."};
 if(course.status==="archived")return{status:409,error:"This course is archived."};
 if(course.status!=="draft"&&body.action!=="archive")return{status:409,error:"Published course content is locked. Create a new course version for curriculum changes."};
 if(body.action==="update")await tx.update(trainingCourses).set({title:String(body.title).trim(),summary:String(body.summary).trim(),instructor:String(body.instructor).trim(),duration:String(body.duration).trim()}).where(eq(trainingCourses.id,course.id));
 else if(body.action==="lesson"){
 const lessons=await tx.select({position:trainingLessons.position}).from(trainingLessons).where(eq(trainingLessons.courseId,course.id));if(lessons.length>=100)return{status:409,error:"A course can have up to 100 lessons."};
 if(pdf){uploaded=path.join(process.cwd(),".data","training-materials",randomUUID()+".pdf");await mkdir(path.dirname(uploaded),{recursive:true});await writeFile(uploaded,pdf,{flag:"wx"});}
 await tx.insert(trainingLessons).values({courseId:course.id,title:String(body.title).trim(),content:String(body.content).trim(),position:Math.max(0,...lessons.map(l=>l.position))+1,fileName:pdf&&file?path.basename(file.name).replace(/[\r\n]/g,"").slice(0,255):null,storedName:uploaded?path.basename(uploaded):null});
 }else if(body.action==="delete_lesson"){
 const [lesson]=await tx.select().from(trainingLessons).where(eq(trainingLessons.id,String(body.lessonId)));if(!lesson||lesson.courseId!==course.id)return{status:404,error:"Lesson not found."};removed=lesson.storedName??undefined;await tx.delete(trainingLessons).where(eq(trainingLessons.id,lesson.id));
 }else if(body.action==="publish"){
 const lessons=await tx.select({id:trainingLessons.id}).from(trainingLessons).where(eq(trainingLessons.courseId,course.id));if(!lessons.length)return{status:409,error:"Add at least one lesson before publishing."};await tx.update(trainingCourses).set({status:"published"}).where(eq(trainingCourses.id,course.id));
 }else await tx.update(trainingCourses).set({status:"archived"}).where(eq(trainingCourses.id,course.id));
 await tx.update(trainingCourses).set({revision:sql`${trainingCourses.revision}+1`}).where(eq(trainingCourses.id,course.id));await tx.insert(trainingEvents).values({courseId:course.id,actorId:actor.id,action:String(body.action)});return{status:200,id:course.id};
 });
 if(result.status!==200&&uploaded){await unlink(uploaded).catch(()=>{});uploaded=undefined;}
 if(result.status===200&&removed&&/^[a-f0-9-]{36}\.pdf$/.test(removed))await unlink(path.join(process.cwd(),".data","training-materials",removed)).catch(()=>{});
 return NextResponse.json(result.status===200?{ok:true,id:result.id}:{error:result.error},{status:result.status});
 }catch{if(uploaded){try{const [retained]=await db.select({id:trainingLessons.id}).from(trainingLessons).where(eq(trainingLessons.storedName,path.basename(uploaded)));if(!retained)await unlink(uploaded).catch(()=>{});}catch{ /* Preserve a material if the commit outcome cannot be checked. */ }}return NextResponse.json({error:"Unable to save training content."},{status:500});}
}
