import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { nannyApplications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { parseApplication, EDITABLE_APPLICATION_STATUSES } from "@/lib/application-data";
import { MAX_APPLICATION_FILE_SIZE_BYTES, MAX_APPLICATION_FILE_SIZE_MB } from "@/data/nanny-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let savedPath: string | undefined;
  let committed = false;

  try {
    if (!isAllowedRequestOrigin(req)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (user.role !== "nanny") return NextResponse.json({ error: "A nanny account is required." }, { status: 403 });
    if (!user.emailVerifiedAt) return NextResponse.json({ error: "Verify your email address before uploading application documents." }, { status: 403 });
    if (Number(req.headers.get("content-length")) > MAX_APPLICATION_FILE_SIZE_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: `Files must be no larger than ${MAX_APPLICATION_FILE_SIZE_MB} MB each.` }, { status: 413 });
    }

    const { id } = await params;
    const form = await req.formData();
    const field = form.get("field");
    const file = form.get("file");
    if ((field !== "photo" && field !== "resume") || !(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Choose a valid professional photo or resume." }, { status: 400 });
    }
    if (file.size > MAX_APPLICATION_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `Choose a file no larger than ${MAX_APPLICATION_FILE_SIZE_MB} MB.` }, { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    const allowed = field === "photo" ? [".png", ".jpg", ".jpeg"] : [".pdf", ".doc", ".docx"];
    if (!allowed.includes(extension)) return NextResponse.json({ error: field === "photo" ? "Use a PNG or JPEG photo." : "Use a PDF or Word resume." }, { status: 400 });
    const content = Buffer.from(await file.arrayBuffer());
    const validSignature = extension === ".png"
      ? content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : [".jpg", ".jpeg"].includes(extension)
        ? content[0] === 255 && content[1] === 216 && content[2] === 255
        : extension === ".pdf"
          ? content.subarray(0, 5).toString() === "%PDF-"
          : extension === ".doc"
            ? content.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]))
            : content[0] === 80 && content[1] === 75 && content.includes(Buffer.from("[Content_Types].xml")) && content.includes(Buffer.from("word/"));
    if (!validSignature) return NextResponse.json({ error: "The file contents do not match the selected file type." }, { status: 400 });

    const storedName = `${randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), ".data", "nanny-uploads");
    await mkdir(directory, { recursive: true });
    savedPath = path.join(directory, storedName);
    await writeFile(savedPath, content, { flag: "wx" });

    const outcome = await db.transaction(async tx => {
      const [application] = await tx.select().from(nannyApplications)
        .where(and(eq(nannyApplications.id, id), eq(nannyApplications.userId, user.id)))
        .for("update");
      if (!application) return { status: 404 as const };
      if (!EDITABLE_APPLICATION_STATUSES.includes(application.status)) return { status: 409 as const };

      const previous = parseApplication(application.bio) ?? { version: 1 as const, values: {}, references: [], workHistory: [], languages: [], attachments: [] };
      const oldAttachment = previous.attachments.find(item => item.field === field);
      const attachment = { field, name: path.basename(file.name), storedName };
      const attachments = [...previous.attachments.filter(item => item.field !== field), attachment];
      await tx.update(nannyApplications).set({ bio: JSON.stringify({ ...previous, attachments }) })
        .where(and(eq(nannyApplications.id, id), eq(nannyApplications.userId, user.id)));
      return { status: 200 as const, oldStoredName: oldAttachment?.storedName, attachment: { field, name: attachment.name } };
    });

    if (outcome.status !== 200) return NextResponse.json({ error: outcome.status === 404 ? "Application draft not found." : "This application can no longer be edited." }, { status: outcome.status });
    committed = true;
    if (outcome.oldStoredName && /^[a-f0-9-]{36}\.(png|jpg|jpeg|pdf|doc|docx)$/.test(outcome.oldStoredName)) {
      await unlink(path.join(directory, outcome.oldStoredName)).catch(() => undefined);
    }
    return NextResponse.json({ ok: true, attachment: outcome.attachment });
  } catch {
    return NextResponse.json({ error: "Could not save this file. Please try again." }, { status: 500 });
  } finally {
    if (!committed && savedPath) await unlink(savedPath).catch(() => undefined);
  }
}
