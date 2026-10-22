import {desc,eq} from "drizzle-orm";
import {db} from "@/db";
import {applicationScreenings,caregiverCredentials,nannyApplications} from "@/db/schema";
import {applicationDigest,backgroundCheckEligible} from "@/lib/screening-policy";
export const CREDENTIAL_KINDS:Record<string,string>={cpr:"CPR certification",first_aid:"First Aid certification"};
export const REQUIRED_CREDENTIALS=Object.keys(CREDENTIAL_KINDS);
export function credentialStatus(record:{status:string;expiresOn:string|null},at=new Date()){
 return record.status==="verified"&&(!record.expiresOn||record.expiresOn<at.toISOString().slice(0,10))?"expired":record.status;
}
export async function credentialsEligible(tx:Parameters<Parameters<typeof db.transaction>[0]>[0],userId:string,through=new Date()){
 const records=await tx.select().from(caregiverCredentials).where(eq(caregiverCredentials.userId,userId));
 if(!REQUIRED_CREDENTIALS.every(kind=>records.some(r=>r.kind===kind&&credentialStatus(r,through)==="verified")))return false;
 const [screening]=await tx.select({bio:nannyApplications.bio,digest:applicationScreenings.applicationDigest,checks:applicationScreenings.checks}).from(nannyApplications).innerJoin(applicationScreenings,eq(applicationScreenings.applicationId,nannyApplications.id)).where(eq(nannyApplications.userId,userId)).orderBy(desc(applicationScreenings.updatedAt)).limit(1);
 if(!screening||screening.digest!==applicationDigest(screening.bio))return false;
 try{return backgroundCheckEligible(JSON.parse(screening.checks),through);}catch{return false;}
}
