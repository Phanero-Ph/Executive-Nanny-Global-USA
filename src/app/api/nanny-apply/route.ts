import { notifySubmission } from "@/lib/mail";
import { notifyVerification } from "@/lib/account-recovery";
import { isDuplicateEntry } from "@/db/errors";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { users, nannyApplications } from "@/db/schema";
import { getCurrentUser, hashPassword, signSession, sessionCookieName, sessionMaxAge } from "@/lib/auth";
import { validRow } from "@/lib/nanny-application";
type Row = Record<string, string>;
import { APPLICATION_STEPS, REFERENCE_FIELDS, WORK_FIELDS, LANGUAGE_FIELDS } from "@/data/nanny-application";
export const runtime = "nodejs";
export async function POST(req: Request) {
 const savedFiles: string[] = [];
 let committed = false;
 try {
  if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const account = await getCurrentUser({allowUnverified:true});
    if(account&&["family","nanny"].includes(account.role)&&!account.emailVerifiedAt)return NextResponse.json({error:"Verify your email address before submitting a request or application. Open the verification link in your email or visit /verify-email to resend it.",code:"EMAIL_VERIFICATION_REQUIRED"},{status:403});
  if (account && account.role !== "nanny") return NextResponse.json({ error: "A nanny account is required." }, { status: 403 });
  if (account && (await db.select({ id: nannyApplications.id }).from(nannyApplications).where(eq(nannyApplications.userId, account.id)).limit(1)).length) return NextResponse.json({ error: "You already have an application. Edit it from your dashboard." }, { status: 409 });
  if (Number(req.headers.get("content-length")) > 17 * 1024 * 1024) return NextResponse.json({ error: "Files must be no larger than 5 MB each." }, { status: 413 });
  const form = await req.formData();
  const payload = form.get("application");
  if (typeof payload !== "string" || payload.length > 200000) return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  const { values, references, workHistory, languages } = JSON.parse(payload);
  if (account && values && typeof values === "object") values.email = account.email;
  if (!validRow(values, APPLICATION_STEPS.flatMap(step => step.fields).filter(field => !account || !["password", "confirmPassword"].includes(field.name))) || !Array.isArray(references) || references.length < 2 || references.length > 20 || !references.every(row => validRow(row, REFERENCE_FIELDS)) || !Array.isArray(workHistory) || !workHistory.length || workHistory.length > 20 || !workHistory.every(row => validRow(row, WORK_FIELDS)) || !Array.isArray(languages) || languages.length > 20 || !languages.every(row => validRow(row, LANGUAGE_FIELDS))) return NextResponse.json({ error: "Please complete all required application fields." }, { status: 400 });
  if (values.speaksOtherLanguages === "Yes" && !languages.length) return NextResponse.json({ error: "Please add the languages you speak." }, { status: 400 });
  if (!account && (values.password.length < 8 || values.password.length > 128)) return NextResponse.json({ error: "Password must be between 8 and 128 characters." }, { status: 400 });
  if (!account && values.password !== values.confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  const email = values.email.trim().toLowerCase();
  if (!account && (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)).length) return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
  const uploads: { field: string; name: string; storedName: string; content: Buffer }[] = [];
  for (const field of ["photo", "cv", "resume"]) {
   const file = form.get(field);
   if (!(file instanceof File) || !file.size) {
    if (field !== "cv") return NextResponse.json({ error: "A professional photo and childcare resume are required." }, { status: 400 });
    continue;
   }
   const extension = path.extname(file.name).toLowerCase();
   const allowed = field === "photo" ? [".png", ".jpg", ".jpeg"] : [".pdf", ".doc", ".docx"];
   if (file.size > 5 * 1024 * 1024 || !allowed.includes(extension)) return NextResponse.json({ error: "Use PNG/JPEG for photos and PDF/Word for documents, up to 5 MB each." }, { status: 400 });
   const content = Buffer.from(await file.arrayBuffer());
   const signature = extension === ".png" ? content.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : [".jpg", ".jpeg"].includes(extension) ? content[0] === 255 && content[1] === 216 && content[2] === 255 : extension === ".pdf" ? content.subarray(0,5).toString() === "%PDF-" : extension === ".doc" ? content.subarray(0,8).equals(Buffer.from([208,207,17,224,161,177,26,225])) : content[0] === 80 && content[1] === 75 && content.includes(Buffer.from("[Content_Types].xml")) && content.includes(Buffer.from("word/"));
   if (!signature) return NextResponse.json({ error: "A file does not match its permitted format." }, { status: 400 });
   uploads.push({ field, name: path.basename(file.name), storedName: `${randomUUID()}${extension}`, content });
  }
  const directory = path.join(process.cwd(), ".data", "nanny-uploads");
  await mkdir(directory, { recursive: true });
  for (const upload of uploads) { const target = path.join(directory, upload.storedName); await writeFile(target, upload.content, { flag: "wx" }); savedFiles.push(target); }
  const cleanValues: Row = {};
  for (const field of APPLICATION_STEPS.flatMap(step => step.fields)) if (!["password", "confirmPassword"].includes(field.name) && typeof values[field.name] === "string") cleanValues[field.name] = values[field.name];
  const name = `${values.firstName.trim()} ${values.lastName.trim()}`;
  const passwordHash = account ? null : hashPassword(values.password);
  const user = await db.transaction(async tx => {
   const created = { id: account?.id ?? randomUUID() };
      if (!account) await tx.insert(users).values({ id: created.id, name, email, phone: values.phone.trim(), role: "nanny", passwordHash: passwordHash! });
   await tx.insert(nannyApplications).values({ userId: created.id, name, email, phone: values.phone.trim(), city: values.homeAddress.trim(), experienceYears: Number(values.yearsInChildcare), availability: `${values.availableStartDate}; ${values.commitmentLength}`, services: APPLICATION_STEPS[2].fields.filter(field => field.type === "checkbox" && values[field.name] === "Yes").map(field => field.label).join(", ") || "Not specified", certifications: values.hasCertifications, bio: JSON.stringify({ version: 1, values: cleanValues, references, workHistory, languages, attachments: uploads.map(({ field, name, storedName }) => ({ field, name, storedName })) }), status: "submitted", subscriptionStatus: "inactive" });
   return created;
  });
  committed = true;
  await notifySubmission(user.id, email, "nanny");
    if (!account) await notifyVerification(user.id);
    const response = NextResponse.json({ ok: true, accountCreated:!account, email });
  if (!account) response.cookies.set(sessionCookieName(), signSession(user.id, "nanny"), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionMaxAge() });
  return response;
 } catch (error) {
    if (isDuplicateEntry(error)) return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
  return NextResponse.json({ error: "Couldn't submit your application. Please try again." }, { status: 500 });
 } finally {
  if (!committed) await Promise.all(savedFiles.map(file => unlink(file).catch(() => undefined)));
 }
}
