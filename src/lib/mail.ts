import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { mailJobs } from "@/db/schema";
import { deliverMail } from "./mail-delivery.mjs";
export function appUrl(path: string) {
 const base = process.env.APP_URL;
 if (!base) throw new Error("APP_URL is required for email links.");
 const url = new URL(path, base);
 if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Production APP_URL must use HTTPS.");
 return url.toString();
}
/** Claim an existing outbox item before sending so the retry worker cannot send it twice. */
export async function deliverQueuedEmail(id:string){
 const [claim]=await db.update(mailJobs).set({status:"sending",attempts:sql`${mailJobs.attempts}+1`,attemptedAt:new Date()}).where(and(eq(mailJobs.id,id),eq(mailJobs.status,"pending")));
 if(!claim.affectedRows)return;
 try{const [job]=await db.select().from(mailJobs).where(eq(mailJobs.id,id));if(!job)return;
  const status=await deliverMail({id,recipient:job.recipient,subject:job.subject,body:job.body});
  await db.update(mailJobs).set({status,sentAt:new Date(),body:""}).where(eq(mailJobs.id,id));
 }catch{await db.update(mailJobs).set({status:"pending"}).where(eq(mailJobs.id,id));}
}
export async function queueEmail(userId:string|null,recipient:string,subject:string,body:string){
 const id=randomUUID();await db.insert(mailJobs).values({id,userId,recipient,subject,body});await deliverQueuedEmail(id);
}
export async function notifySubmission(userId: string | null, email: string, role: "family" | "nanny") {
 try { await queueEmail(userId,email,role === "family" ? "We received your care request" : "We received your nanny application",`Thank you for your submission. Our team will review it and contact you about the next steps.\n\n${userId ? `Track your progress: ${appUrl(`/dashboard/${role}`)}` : "Our team will contact you about the next steps."}\n\nExecutive Global Nanny`); } catch { console.error("Submission confirmation could not be queued."); }
}
