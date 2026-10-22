import {count,eq} from "drizzle-orm";
import {db} from "@/db";
import {familyRequests,nannyApplications,nannyMatches} from "@/db/schema";
import {adminRequestVisibility} from "@/lib/admin-request-visibility";
export async function agencyReports(){const [requests,applications,matches]=await Promise.all([db.select({status:familyRequests.status,category:familyRequests.careCategory,total:count()}).from(familyRequests).where(adminRequestVisibility()).groupBy(familyRequests.status,familyRequests.careCategory),db.select({status:nannyApplications.status,total:count()}).from(nannyApplications).groupBy(nannyApplications.status),db.select({status:nannyMatches.status,total:count()}).from(nannyMatches).innerJoin(familyRequests,eq(familyRequests.id,nannyMatches.familyRequestId)).where(adminRequestVisibility()).groupBy(nannyMatches.status)]);return{requests,applications,matches};}
export function csv(rows:(string|number|null)[][]){return '\uFEFF'+rows.map(row=>row.map(value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
