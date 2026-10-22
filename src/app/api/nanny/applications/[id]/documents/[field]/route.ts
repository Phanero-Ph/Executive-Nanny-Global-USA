import {adminCan} from "@/lib/admin-permissions";
import { and, eq, inArray } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { familyRequests,nannyApplications,nannyMatches } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseApplication } from "@/lib/application-data";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ id: string; field: string }> }) {
 const user = await getCurrentUser();
 if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });if(user.role==="admin"&&!await adminCan(user,"nannies.view"))return Response.json({error:"Permission required."},{status:403});
 if (user.role !== "nanny" && user.role !== "admin" && user.role !== "family") return Response.json({ error: "You do not have access to this document." }, { status: 403 });
 const { id, field } = await params;
 if(user.role==="family"){
  if(field!=="photo")return Response.json({error:"This document is private to the nanny and agency."},{status:404});
  const [match]=await db.select({id:nannyMatches.id}).from(nannyMatches).innerJoin(familyRequests,eq(nannyMatches.familyRequestId,familyRequests.id)).where(and(eq(nannyMatches.nannyApplicationId,id),eq(familyRequests.userId,user.id),inArray(nannyMatches.status,["shortlisted","placed"]))).limit(1);
  if(!match)return Response.json({error:"This photo is available only to the family currently matched with this nanny."},{status:404});
 }
 const [application] = await db.select({ bio: nannyApplications.bio }).from(nannyApplications).where(user.role === "admin"||user.role==="family" ? eq(nannyApplications.id,id) : and(eq(nannyApplications.id,id),eq(nannyApplications.userId,user.id))).limit(1);
 const attachment = application && parseApplication(application.bio)?.attachments.find(item => item.field === field);
 if (!attachment || !/^[a-f0-9-]{36}\.(png|jpg|jpeg|pdf|doc|docx)$/.test(attachment.storedName)) return Response.json({ error: "Document not found." }, { status: 404 });
 try {
  const data = await readFile(path.join(process.cwd(),".data","nanny-uploads",attachment.storedName));
  const extension = path.extname(attachment.storedName);
  const types: Record<string,string> = { ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".pdf":"application/pdf", ".doc":"application/msword", ".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  const inline = [".png",".jpg",".jpeg",".pdf"].includes(extension) && new URL(req.url).searchParams.get("download") !== "1";
  const headers: Record<string,string> = { "Content-Type":types[extension], "Content-Disposition":`${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`, "Content-Length":String(data.length), "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff", "Cross-Origin-Resource-Policy":"same-origin", "Referrer-Policy":"no-referrer" };
  // Chromium's built-in PDF viewer renders a blank frame when the PDF response itself is sandboxed by CSP.
  // Keep the response private and nosniff, but let the browser's isolated PDF viewer render the inline preview.
  if (!(inline && extension === ".pdf")) headers["Content-Security-Policy"] = "sandbox; default-src 'none'";
  return new Response(new Uint8Array(data), { headers });
 } catch { return Response.json({ error: "Document is unavailable. Please contact our team." }, { status: 404 }); }
}
