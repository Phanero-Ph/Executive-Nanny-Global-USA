import { notifySubmission } from "@/lib/mail";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { isDuplicateEntry } from "@/db/errors";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { users, nannyApplications, applicationScreenings, reviewEvents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { validRow } from "@/lib/nanny-application";
import { parseApplication, EDITABLE_APPLICATION_STATUSES } from "@/lib/application-data";
import { APPLICATION_STEPS, REFERENCE_FIELDS, WORK_FIELDS, LANGUAGE_FIELDS } from "@/data/nanny-application";
type Row = Record<string, string>;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const savedFiles: string[] = [];
  let committed = false;
  try {
    if (!isAllowedRequestOrigin(req)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
    const account = await getCurrentUser({ allowUnverified: true });
    if (!account) return NextResponse.json({ error: "Create your nanny account, verify your email, and sign in before submitting your application." }, { status: 401 });
    if (account.role !== "nanny") return NextResponse.json({ error: "You are signed in to a different account. Sign out and create a nanny account before applying." }, { status: 403 });
    if (!account.emailVerifiedAt) return NextResponse.json({ error: "Verify your email address before submitting your application." }, { status: 403 });
    if (Number(req.headers.get("content-length")) > 17 * 1024 * 1024) return NextResponse.json({ error: "Files must be no larger than 5 MB each." }, { status: 413 });

    const [draft] = await db.select().from(nannyApplications).where(eq(nannyApplications.userId, account.id)).orderBy(desc(nannyApplications.createdAt), desc(nannyApplications.id)).limit(1);
    if (!draft || !EDITABLE_APPLICATION_STATUSES.includes(draft.status)) return NextResponse.json({ error: "Your application draft was not found. Open your dashboard and continue your application there." }, { status: 409 });
    const previous = parseApplication(draft.bio);

    const form = await req.formData();
    const payload = form.get("application");
    if (typeof payload !== "string" || payload.length > 200000) return NextResponse.json({ error: "Invalid application." }, { status: 400 });
    const { values, references, workHistory, languages } = JSON.parse(payload) as { values: Row; references: Row[]; workHistory: Row[]; languages: Row[] };
    if (!values || typeof values !== "object" || Array.isArray(values)) return NextResponse.json({ error: "Invalid application." }, { status: 400 });
    values.email = account.email;
    const fields = APPLICATION_STEPS.flatMap(step => step.fields).filter(field => !["password", "confirmPassword"].includes(field.name));
    if (!validRow(values, fields) || !Array.isArray(references) || references.length < 2 || references.length > 20 || !references.every(row => validRow(row, REFERENCE_FIELDS)) || !Array.isArray(workHistory) || !workHistory.length || workHistory.length > 20 || !workHistory.every(row => validRow(row, WORK_FIELDS)) || !Array.isArray(languages) || languages.length > 20 || !languages.every(row => validRow(row, LANGUAGE_FIELDS))) return NextResponse.json({ error: "Please complete all required application fields." }, { status: 400 });
    if (values.speaksOtherLanguages === "Yes" && !languages.length) return NextResponse.json({ error: "Please add the languages you speak." }, { status: 400 });

    const uploads: { field: string; name: string; storedName: string; content: Buffer }[] = [];
    for (const field of ["photo", "cv", "resume"]) {
      const file = form.get(field);
      if (!(file instanceof File) || !file.size) {
        if ((field === "photo" || field === "resume") && !previous?.attachments.some(item => item.field === field)) return NextResponse.json({ error: "A professional photo and childcare resume are required." }, { status: 400 });
        continue;
      }
      const extension = path.extname(file.name).toLowerCase();
      const allowed = field === "photo" ? [".png", ".jpg", ".jpeg"] : [".pdf", ".doc", ".docx"];
      if (file.size > 5 * 1024 * 1024 || !allowed.includes(extension)) return NextResponse.json({ error: "Use PNG/JPEG for photos and PDF/Word for documents, up to 5 MB each." }, { status: 400 });
      const content = Buffer.from(await file.arrayBuffer());
      const signature = extension === ".png" ? content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : [".jpg", ".jpeg"].includes(extension) ? content[0] === 255 && content[1] === 216 && content[2] === 255 : extension === ".pdf" ? content.subarray(0, 5).toString() === "%PDF-" : extension === ".doc" ? content.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225])) : content[0] === 80 && content[1] === 75 && content.includes(Buffer.from("[Content_Types].xml")) && content.includes(Buffer.from("word/"));
      if (!signature) return NextResponse.json({ error: "A file does not match its permitted format." }, { status: 400 });
      uploads.push({ field, name: path.basename(file.name), storedName: `${randomUUID()}${extension}`, content });
    }

    const directory = path.join(process.cwd(), ".data", "nanny-uploads");
    await mkdir(directory, { recursive: true });
    for (const upload of uploads) { const target = path.join(directory, upload.storedName); await writeFile(target, upload.content, { flag: "wx" }); savedFiles.push(target); }
    const cleanValues: Row = {};
    for (const field of fields) if (typeof values[field.name] === "string") cleanValues[field.name] = values[field.name];
    const name = `${values.firstName.trim()} ${values.lastName.trim()}`;
    const attachments = [...(previous?.attachments ?? []).filter(item => !uploads.some(upload => upload.field === item.field)), ...uploads.map(({ field, name, storedName }) => ({ field, name, storedName }))];

    const outcome = await db.transaction(async tx => {
      const [current] = await tx.select().from(nannyApplications).where(and(eq(nannyApplications.id, draft.id), eq(nannyApplications.userId, account.id))).for("update");
      if (!current) return 404;
      if (!EDITABLE_APPLICATION_STATUSES.includes(current.status)) return 409;
      await tx.update(nannyApplications).set({
        name,
        email: account.email,
        phone: values.phone.trim(),
        city: values.homeAddress.trim(),
        experienceYears: Number(values.yearsInChildcare),
        availability: `${values.availableStartDate}; ${values.commitmentLength}`,
        services: APPLICATION_STEPS[2].fields.filter(field => field.type === "checkbox" && values[field.name] === "Yes").map(field => field.label).join(", ") || "Not specified",
        certifications: values.hasCertifications,
        bio: JSON.stringify({ version: 1, values: cleanValues, references, workHistory, languages, attachments }),
        status: "submitted",
      }).where(and(eq(nannyApplications.id, draft.id), eq(nannyApplications.userId, account.id)));
      await tx.delete(applicationScreenings).where(eq(applicationScreenings.applicationId, draft.id));
      if (current.status !== "submitted") await tx.insert(reviewEvents).values({ reviewerId: account.id, nannyApplicationId: draft.id, fromStatus: current.status, toStatus: "submitted", note: "Nanny submitted the completed application for agency review." });
      await tx.update(users).set({ name, phone: values.phone.trim(), updatedAt: new Date() }).where(eq(users.id, account.id));
      return 200;
    });
    if (outcome !== 200) return NextResponse.json({ error: outcome === 404 ? "Application draft not found." : "This application can no longer be submitted." }, { status: outcome });

    committed = true;
    await notifySubmission(account.id, account.email, "nanny");
    return NextResponse.json({ ok: true, accountCreated: false, email: account.email });
  } catch (error) {
    if (isDuplicateEntry(error)) return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    return NextResponse.json({ error: "Couldn't submit your application. Please try again." }, { status: 500 });
  } finally {
    if (!committed) await Promise.all(savedFiles.map(file => unlink(file).catch(() => undefined)));
  }
}
