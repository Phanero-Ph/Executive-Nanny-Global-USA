import {eq} from "drizzle-orm";
import {db} from "@/db";
import {applicationScreenings} from "@/db/schema";
import {parseApplication} from "@/lib/application-data";
import {credentialsEligible} from "@/lib/credentials";
import {applicationDigest,screeningComplete} from "@/lib/screening-policy";
export async function screeningEligible(tx:Parameters<Parameters<typeof db.transaction>[0]>[0],application:{id:string;bio:string|null;userId:string|null}){
 if(!application.userId)return false;
 const data=parseApplication(application.bio);
 const [row]=await tx.select().from(applicationScreenings).where(eq(applicationScreenings.applicationId,application.id));
 if(!data||!row||row.applicationDigest!==applicationDigest(application.bio))return false;
 try{const refs=JSON.parse(row.referenceReviews);return refs.length===data.references.length&&screeningComplete(JSON.parse(row.checks),refs)&&await credentialsEligible(tx,application.userId);}catch{return false;}
}
