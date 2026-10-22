import {adminCan} from "@/lib/admin-permissions";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {caregiverCredentials} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();if(!user)return Response.json({error:"Please sign in."},{status:401});if(user.role==="admin"&&!await adminCan(user,"credentials.view"))return Response.json({error:"Permission required."},{status:403});
 const {id}=await params;const [record]=await db.select().from(caregiverCredentials).where(eq(caregiverCredentials.id,id));
 if(!record||!(user.role==="admin"||user.role==="nanny"&&user.id===record.userId)||!/^[a-f0-9-]{36}\.pdf$/.test(record.storedName))return Response.json({error:"Document not found."},{status:404});
 const preview=new URL(req.url).searchParams.get("preview")==="1";
 try{const data=await readFile(path.join(process.cwd(),".data","credentials",record.storedName));const headers:Record<string,string>={"Content-Type":"application/pdf","Content-Disposition":`${preview?"inline":"attachment"}; filename*=UTF-8''${encodeURIComponent(record.fileName)}`,"Content-Length":String(data.length),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin","Referrer-Policy":"no-referrer"};if(!preview)headers["Content-Security-Policy"]="sandbox; default-src 'none'";return new Response(new Uint8Array(data),{headers});}catch{return Response.json({error:"Document unavailable."},{status:404});}
}
