import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { familyRequests, membershipCycles, membershipPayments } from "@/db/schema";
import { membershipWindow } from "./bookings";

export const SUBMISSION_LIMITS: Record<string, number | null> = { Basic: 3, Standard: 5, Deluxe: 8, Premium: null };
export class PlacementError extends Error {
 constructor(message: string, public status = 409) { super(message); }
}
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Call while holding the user's row lock. A simultaneous submission cannot
// consume the same final allowance, even when different browser tabs submit.
export async function nannySubmissionAllowance(tx: Tx, userId: string) {
 const cycles = await tx.select().from(membershipCycles).where(eq(membershipCycles.userId,userId)).orderBy(sql`${membershipCycles.startDate} DESC`).for("update");
 for (const cycle of cycles) {
  const window = membershipWindow(cycle), now = new Date();
  if (cycle.cancelledAt || now < window.start || now >= window.end || !Object.hasOwn(SUBMISSION_LIMITS,cycle.plan)) continue;
  const receipts = await tx.select().from(membershipPayments).where(eq(membershipPayments.cycleId,cycle.id)).for("update");
  if (receipts.filter(p=>!p.voidedAt).reduce((sum,p)=>sum+p.amountCents-p.refundedCents,0) < cycle.amountCents) continue;
  const [{used}] = await tx.select({used:count()}).from(familyRequests).where(and(eq(familyRequests.membershipCycleId,cycle.id),eq(familyRequests.careCategory,"nanny")));
  return {cycleId:cycle.id, plan:cycle.plan, used, limit:SUBMISSION_LIMITS[cycle.plan]};
 }
 return null;
}

export function caregiverSearchAllowed(request: {careCategory:string;searchFeeStatus:string}) {
 return request.careCategory !== "caregiver" || request.searchFeeStatus === "paid";
}
export function caregiverPlacementAllowed(request: {careCategory:string;searchFeeStatus:string;placementFeeStatus:string}) {
 return caregiverSearchAllowed(request) && (request.careCategory !== "caregiver" || request.placementFeeStatus === "paid");
}
