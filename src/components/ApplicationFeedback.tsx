import Link from "next/link";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {applicationScreenings} from "@/db/schema";
export async function ApplicationFeedback({id,status}:{id:string;status:string}){
 if(!["changes_requested","rejected"].includes(status))return null;
 const [row]=await db.select({feedback:applicationScreenings.feedback}).from(applicationScreenings).where(eq(applicationScreenings.applicationId,id));
 return <aside className="my-6 rounded-2xl border border-cream-300 bg-white p-6"><h2 className="text-xl text-ink-900">{status==="changes_requested"?"Your application needs an update":"Application decision"}</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{row?.feedback||"Please contact the agency for details."}</p>{status==="changes_requested"&&<Link href={`/dashboard/nanny/edit/${id}`} className="application-secondary mt-5">Update and resubmit application</Link>}</aside>;
}
