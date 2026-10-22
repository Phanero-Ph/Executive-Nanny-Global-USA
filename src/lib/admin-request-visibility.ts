import {and,eq,exists,isNotNull,or} from "drizzle-orm";
import {db} from "@/db";
import {caregiverFees,familyRequests} from "@/db/schema";

// Babysitter submission already requires a paid subscription. Nanny requests
// are released only by a confirmed search-payment ledger entry, never a status
// edit or a checkout redirect. Once released, keep them visible if refunded so
// administrators can review the refund and resolve the placement safely.
export function adminRequestVisibility(){
 return or(eq(familyRequests.careCategory,"nanny"),exists(
  db.select({id:caregiverFees.id}).from(caregiverFees).where(and(
   eq(caregiverFees.requestId,familyRequests.id),
   eq(caregiverFees.kind,"search"),
   isNotNull(caregiverFees.paidAt),
  )),
 ));
}
