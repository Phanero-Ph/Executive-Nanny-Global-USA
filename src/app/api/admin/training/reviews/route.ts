import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {and,count,eq,isNull,sql} from "drizzle-orm";
import {db} from "@/db";
import {users,trainingCourses,trainingLessons,trainingEnrollments,trainingProgress,trainingCertificates,trainingEvents,mailJobs} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {appUrl} from "@/lib/mail";
export async function POST(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});if(!await adminCan(actor,"training.manage"))return NextResponse.json({error:"You do not have permission for this action."},{status:403});
 const body=await req.json().catch(()=>null);if(!body||typeof body.enrollmentId!=="string"||!Number.isInteger(body.revision)||!["issue","return","revoke"].includes(body.action)||typeof body.note!=="string"||body.note.length>2000||typeof body.feedback!=="string"||body.feedback.length>2000)return NextResponse.json({error:"Invalid review request."},{status:400});
 if(body.action==="return"&&!body.feedback.trim()||body.action==="revoke"&&!body.note.trim())return NextResponse.json({error:"Provide caregiver feedback for a return, or an internal reason for revocation."},{status:400});
 try{
 const [snapshot]=await db.select().from(trainingEnrollments).where(eq(trainingEnrollments.id,body.enrollmentId));if(!snapshot)return NextResponse.json({error:"Enrollment not found."},{status:404});
 const result=await db.transaction(async tx=>{
 const [course]=await tx.select().from(trainingCourses).where(eq(trainingCourses.id,snapshot.courseId)).for("update");if(!course||course.status==="draft")return{status:409,error:"Course is unavailable."};
 const [trainee]=await tx.select().from(users).where(eq(users.id,snapshot.userId)).for("update");if(!trainee||trainee.role!=="nanny")return{status:409,error:"Caregiver account unavailable."};
 const [enrollment]=await tx.select().from(trainingEnrollments).where(eq(trainingEnrollments.id,snapshot.id)).for("update");if(!enrollment||enrollment.revision!==body.revision)return{status:409,error:"This enrollment changed. Refresh before reviewing."};
 let certificateId:string|undefined;
 if(body.action==="revoke"){
 const [certificate]=await tx.select().from(trainingCertificates).where(and(eq(trainingCertificates.enrollmentId,enrollment.id),isNull(trainingCertificates.revokedAt))).for("update");if(!certificate)return{status:409,error:"No active certificate to revoke."};
 await tx.update(trainingCertificates).set({revokedAt:new Date(),revokedBy:actor.id,revocationReason:body.note.trim()}).where(eq(trainingCertificates.id,certificate.id));await tx.update(trainingEnrollments).set({status:"review_pending",feedback:"Your certificate needs review. Please contact the academy team."}).where(eq(trainingEnrollments.id,enrollment.id));
 }else{
 if(enrollment.status!=="review_pending")return{status:409,error:"A caregiver must submit completion for review first."};
 if(body.action==="return")await tx.update(trainingEnrollments).set({status:"enrolled",feedback:body.feedback.trim()}).where(eq(trainingEnrollments.id,enrollment.id));
 else{
 const [{total}]=await tx.select({total:count()}).from(trainingLessons).where(eq(trainingLessons.courseId,course.id));const [{done}]=await tx.select({done:count()}).from(trainingProgress).innerJoin(trainingLessons,eq(trainingProgress.lessonId,trainingLessons.id)).where(and(eq(trainingProgress.enrollmentId,enrollment.id),eq(trainingLessons.courseId,course.id)));if(!total||done!==total)return{status:409,error:"All lessons must be completed before issuing a certificate."};
 const [existing]=await tx.select({id:trainingCertificates.id}).from(trainingCertificates).where(and(eq(trainingCertificates.enrollmentId,enrollment.id),isNull(trainingCertificates.revokedAt)));if(existing)return{status:409,error:"A certificate is already issued."};
 const [certificate]=await tx.insert(trainingCertificates).values({enrollmentId:enrollment.id,courseTitle:course.title,traineeName:trainee.name,issuerName:actor.name,issuedBy:actor.id}).$returningId();certificateId=certificate.id;await tx.update(trainingEnrollments).set({status:"completed",feedback:null}).where(eq(trainingEnrollments.id,enrollment.id));
 }
 }
 await tx.update(trainingEnrollments).set({revision:sql`${trainingEnrollments.revision}+1`}).where(eq(trainingEnrollments.id,enrollment.id));await tx.insert(trainingEvents).values({courseId:course.id,enrollmentId:enrollment.id,actorId:actor.id,action:body.action,note:body.note.trim()||null});
 await tx.insert(mailJobs).values({userId:trainee.id,recipient:trainee.email,subject:`Training result ${enrollment.id}`,body:`Your training review has been updated. View feedback and certificates in your academy: ${appUrl(`/dashboard/nanny/training/${course.id}`)}`});return{status:200,id:certificateId};
 },{isolationLevel:"read committed"});return NextResponse.json(result.status===200?{ok:true,certificateId:result.id}:{error:result.error},{status:result.status});
 }catch{return NextResponse.json({error:"Unable to review training completion."},{status:500});}
}
