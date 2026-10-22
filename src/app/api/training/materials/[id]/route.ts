import {adminCan} from "@/lib/admin-permissions";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {and,eq} from "drizzle-orm";
import {db} from "@/db";
import {trainingLessons,trainingEnrollments} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
export const runtime="nodejs";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();if(!user)return Response.json({error:"Please sign in."},{status:401});if(user.role==="admin"&&!await adminCan(user,"training.view"))return Response.json({error:"Permission required."},{status:403});if(!["admin","nanny"].includes(user.role))return Response.json({error:"Caregiver account required."},{status:403});
 const {id}=await params;const [lesson]=await db.select().from(trainingLessons).where(eq(trainingLessons.id,id));if(!lesson?.storedName||!/^[a-f0-9-]{36}\.pdf$/.test(lesson.storedName))return Response.json({error:"Material not found."},{status:404});
 if(user.role!=="admin"){const [enrolled]=await db.select({id:trainingEnrollments.id}).from(trainingEnrollments).where(and(eq(trainingEnrollments.courseId,lesson.courseId),eq(trainingEnrollments.userId,user.id)));if(!enrolled)return Response.json({error:"Material not found."},{status:404});}
 try{const data=await readFile(path.join(process.cwd(),".data","training-materials",lesson.storedName));return new Response(new Uint8Array(data),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(lesson.fileName||"lesson.pdf")}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox"}});}catch{return Response.json({error:"Material unavailable. Contact the academy team."},{status:404});}
}
