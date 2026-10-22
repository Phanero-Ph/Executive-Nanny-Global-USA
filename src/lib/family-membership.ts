import {desc,eq,inArray} from "drizzle-orm";
import {db} from "@/db";
import {membershipCycles,membershipPayments} from "@/db/schema";
import {cycleStatus} from "@/lib/membership";
import {SUBMISSION_LIMITS} from "@/lib/placement-policy";
export async function hasPaidFamilyMembership(userId:string){
 const cycles=await db.select().from(membershipCycles).where(eq(membershipCycles.userId,userId)).orderBy(desc(membershipCycles.startDate));
 if(!cycles.length)return false;
 const receipts=await db.select().from(membershipPayments).where(inArray(membershipPayments.cycleId,cycles.map(c=>c.id)));
 return cycles.some(c=>Object.hasOwn(SUBMISSION_LIMITS,c.plan)&&cycleStatus(c,receipts.filter(r=>r.cycleId===c.id&&!r.voidedAt).reduce((sum,r)=>sum+r.amountCents-r.refundedCents,0))==="Active");
}
