import { NextResponse } from "next/server";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, nannyApplications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseApplication, EDITABLE_APPLICATION_STATUSES } from "@/lib/application-data";
import { APPLICATION_STEPS, REFERENCE_FIELDS, WORK_FIELDS, LANGUAGE_FIELDS, type ApplicationField } from "@/data/nanny-application";

type Row = Record<string, string>;

function cleanRows(input: unknown, fields: ApplicationField[]): Row[] | null {
  if (!Array.isArray(input) || input.length > 20) return null;
  const allowed = new Set(fields.map(field => field.name));
  const result: Row[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row: Row = {};
    for (const [key, value] of Object.entries(item)) {
      if (!allowed.has(key) || typeof value !== "string" || value.length > 20000) return null;
      row[key] = value;
    }
    result.push(row);
  }
  return result;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedRequestOrigin(req)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "nanny") return NextResponse.json({ error: "A nanny account is required." }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;
    if (body.action !== "saveDraft") return NextResponse.json({ error: "Use the application submit action to send your application for review." }, { status: 400 });
    if (!body.values || typeof body.values !== "object" || Array.isArray(body.values)) return NextResponse.json({ error: "Invalid application draft." }, { status: 400 });

    const allowedValues = new Set(APPLICATION_STEPS.flatMap(step => step.fields).filter(field => !["password", "confirmPassword"].includes(field.name)).map(field => field.name));
    const values: Row = {};
    for (const [key, value] of Object.entries(body.values as Record<string, unknown>)) {
      if (!allowedValues.has(key) || typeof value !== "string" || value.length > 20000) return NextResponse.json({ error: "Invalid application draft." }, { status: 400 });
      values[key] = value;
    }
    values.email = user.email;
    const references = cleanRows(body.references, REFERENCE_FIELDS);
    const workHistory = cleanRows(body.workHistory, WORK_FIELDS);
    const languages = cleanRows(body.languages, LANGUAGE_FIELDS);
    if (!references || !workHistory || !languages) return NextResponse.json({ error: "Invalid application draft." }, { status: 400 });

    const outcome = await db.transaction(async tx => {
      const [application] = await tx.select().from(nannyApplications).where(and(eq(nannyApplications.id, id), eq(nannyApplications.userId, user.id))).for("update");
      if (!application) return 404;
      if (!EDITABLE_APPLICATION_STATUSES.includes(application.status)) return 409;
      const previous = parseApplication(application.bio) ?? { version: 1 as const, values: {}, references: [], workHistory: [], languages: [], attachments: [] };
      const mergedValues = { ...previous.values, ...values };
      const firstName = mergedValues.firstName?.trim() ?? "";
      const lastName = mergedValues.lastName?.trim() ?? "";
      const name = firstName && lastName ? `${firstName} ${lastName}` : application.name;
      const phone = mergedValues.phone?.trim() || application.phone;
      const availability = mergedValues.availableStartDate || mergedValues.commitmentLength
        ? `${mergedValues.availableStartDate ?? ""}; ${mergedValues.commitmentLength ?? ""}`
        : application.availability;
      const services = APPLICATION_STEPS[2].fields.filter(field => field.type === "checkbox" && mergedValues[field.name] === "Yes").map(field => field.label).join(", ") || application.services;

      await tx.update(nannyApplications).set({
        name,
        email: user.email,
        phone,
        city: mergedValues.homeAddress?.trim() || application.city,
        experienceYears: mergedValues.yearsInChildcare ? Number(mergedValues.yearsInChildcare) : application.experienceYears,
        availability,
        services,
        certifications: mergedValues.hasCertifications || application.certifications,
        bio: JSON.stringify({ version: 1, values: mergedValues, references, workHistory, languages, attachments: previous.attachments }),
      }).where(and(eq(nannyApplications.id, id), eq(nannyApplications.userId, user.id)));
      if (name !== application.name || phone !== application.phone) {
        await tx.update(users).set({ name, phone, updatedAt: new Date() }).where(eq(users.id, user.id));
      }
      return 200;
    });

    if (outcome !== 200) return NextResponse.json({ error: outcome === 404 ? "Draft not found." : "This application can no longer be edited." }, { status: outcome });
    return NextResponse.json({ ok: true, saved: true });
  } catch {
    return NextResponse.json({ error: "Could not save application draft." }, { status: 500 });
  }
}
