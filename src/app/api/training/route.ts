import {adminCan} from "@/lib/admin-permissions";
import {NextResponse} from "next/server";
import {and,count,eq,sql} from "drizzle-orm";
import {db} from "@/db";
import {users,trainingCourses,trainingLessons,trainingEnrollments,trainingProgress,trainingEvents,mailJobs} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {appUrl} from "@/lib/mail";
export async function POST(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role!=="nanny")return NextResponse.json({error:"A caregiver account is required."},{status:403});
 const body=await req.json().catch(()=>null);if(!body||typeof body.courseId!=="string"||!["enroll","lesson","review"].includes(body.action))return NextResponse.json({error:"Invalid academy request."},{status:400});
 if(body.action!=="enroll"&&!Number.isInteger(body.revision))return NextResponse.json({error:"Invalid enrollment revision."},{status:400});
 if(body.action==="review"&&(typeof body.reflection!=="string"||body.reflection.trim().length<20||body.reflection.length>3000))return NextResponse.json({error:"Add a completion reflection of 20 to 3,000 characters."},{status:400});
 try{const result=await db.transaction(async tx=>{
 const [course]=await tx.select().from(trainingCourses).where(eq(trainingCourses.id,body.courseId)).for("update");if(!course||course.status==="draft")return{status:404,error:"Course not found."};
 const [account]=await tx.select({role:users.role}).from(users).where(eq(users.id,actor.id)).for("update");if(account?.role!=="nanny")return{status:403,error:"Caregiver account required."};
 const [enrollment]=await tx.select().from(trainingEnrollments).where(and(eq(trainingEnrollments.courseId,course.id),eq(trainingEnrollments.userId,actor.id))).for("update");
 if(body.action==="enroll"){
 if(enrollment)return{status:200,id:enrollment.id};if(course.status!=="published")return{status:409,error:"This course is no longer accepting enrollments."};
 const [created]=await tx.insert(trainingEnrollments).values({courseId:course.id,userId:actor.id}).$returningId();await tx.insert(trainingEvents).values({courseId:course.id,enrollmentId:created.id,actorId:actor.id,action:"enrolled"});return{status:200,id:created.id};
 }
 if(!enrollment)return{status:404,error:"Enrollment not found."};if(enrollment.revision!==body.revision)return{status:409,error:"Progress changed. Refresh before saving."};if(enrollment.status!=="enrolled")return{status:409,error:"This enrollment is under review or already completed."};
 if(body.action==="lesson"){
 if(typeof body.lessonId!=="string")return{status:400,error:"Choose a lesson."};const [lesson]=await tx.select({id:trainingLessons.id}).from(trainingLessons).where(and(eq(trainingLessons.id,body.lessonId),eq(trainingLessons.courseId,course.id)));if(!lesson)return{status:404,error:"Lesson not found."};
 const [existing]=await tx.select({id:trainingProgress.id}).from(trainingProgress).where(and(eq(trainingProgress.enrollmentId,enrollment.id),eq(trainingProgress.lessonId,lesson.id)));if(existing)return{status:200,id:enrollment.id};await tx.insert(trainingProgress).values({enrollmentId:enrollment.id,lessonId:lesson.id});
 }else{
 const [{total}]=await tx.select({total:count()}).from(trainingLessons).where(eq(trainingLessons.courseId,course.id));const [{done}]=await tx.select({done:count()}).from(trainingProgress).innerJoin(trainingLessons,eq(trainingProgress.lessonId,trainingLessons.id)).where(and(eq(trainingProgress.enrollmentId,enrollment.id),eq(trainingLessons.courseId,course.id)));if(!total||done!==total)return{status:409,error:"Complete every lesson before submitting for review."};
 await tx.update(trainingEnrollments).set({status:"review_pending",reflection:body.reflection.trim(),feedback:null}).where(eq(trainingEnrollments.id,enrollment.id));
 const admins=await tx.select({id:users.id,email:users.email}).from(users).where(eq(users.role,"admin")).limit(100);for(const admin of admins){if(!await adminCan({...admin,role:"admin"},"training.view",tx))continue;await tx.insert(mailJobs).values({userId:admin.id,recipient:admin.email,subject:`Training review ${enrollment.id}`,body:`A caregiver submitted a completed course for review. Open academy administration: ${appUrl(`/dashboard/admin/training/${course.id}`)}`});}
 }
 await tx.update(trainingEnrollments).set({revision:sql`${trainingEnrollments.revision}+1`}).where(eq(trainingEnrollments.id,enrollment.id));await tx.insert(trainingEvents).values({courseId:course.id,enrollmentId:enrollment.id,actorId:actor.id,action:body.action});return{status:200,id:enrollment.id};
 },{isolationLevel:"read committed"});return NextResponse.json(result.status===200?{ok:true,id:result.id}:{error:result.error},{status:result.status});}catch{return NextResponse.json({error:"Unable to save academy progress."},{status:500});}
}
