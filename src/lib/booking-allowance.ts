import {and,count,eq,inArray} from "drizzle-orm";
import {db} from "@/db";
import {membershipCycles,membershipPayments,careBookings} from "@/db/schema";
import {BOOKING_LIMITS,membershipWindow} from "./bookings";
export async function bookingAllowance(userId:string){
 const cycles=await db.select().from(membershipCycles).where(eq(membershipCycles.userId,userId));
 for(const c of cycles){const window=membershipWindow(c),now=new Date();if(c.cancelledAt||now<window.start||now>=window.end||!Object.hasOwn(BOOKING_LIMITS,c.plan))continue;
 const payments=await db.select().from(membershipPayments).where(eq(membershipPayments.cycleId,c.id));if(payments.filter(p=>!p.voidedAt).reduce((s,p)=>s+p.amountCents-p.refundedCents,0)<c.amountCents)continue;
 const [{used}]=await db.select({used:count()}).from(careBookings).where(and(eq(careBookings.cycleId,c.id),eq(careBookings.consumesCredit,1)));const limit=BOOKING_LIMITS[c.plan];return{plan:c.plan,used,limit,remaining:limit===null?null:Math.max(0,limit-used)};
 }return null;
}
export async function bookingUsage(cycleIds:string[]){return cycleIds.length?db.select({cycleId:careBookings.cycleId,used:count()}).from(careBookings).where(and(inArray(careBookings.cycleId,cycleIds),eq(careBookings.consumesCredit,1))).groupBy(careBookings.cycleId):[];}
