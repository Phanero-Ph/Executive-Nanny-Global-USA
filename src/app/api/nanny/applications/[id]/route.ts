import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, nannyApplications, applicationScreenings, reviewEvents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { validRow } from "@/lib/nanny-application";
import { parseApplication, EDITABLE_APPLICATION_STATUSES } from "@/lib/application-data";
import { APPLICATION_STEPS, REFERENCE_FIELDS, WORK_FIELDS, LANGUAGE_FIELDS } from "@/data/nanny-application";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
 if (user.role !== "nanny") return NextResponse.json({ error: "A nanny account is required." }, { status: 403 });
 try {
  const { id } = await params;
  const { values, references, workHistory, languages } = await req.json();
  if (values && typeof values === "object") values.email = user.email;
  const fields = APPLICATION_STEPS.flatMap(step => step.fields).filter(field => !["password", "confirmPassword"].includes(field.name));
  if (!validRow(values, fields) || !Array.isArray(references) || references.length < 2 || references.length > 20 || !references.every(row => validRow(row, REFERENCE_FIELDS)) || !Array.isArray(workHistory) || !workHistory.length || workHistory.length > 20 || !workHistory.every(row => validRow(row, WORK_FIELDS)) || !Array.isArray(languages) || languages.length > 20 || !languages.every(row => validRow(row, LANGUAGE_FIELDS)) || (values.speaksOtherLanguages === "Yes" && !languages.length)) return NextResponse.json({ error: "Complete all required application fields." }, { status: 400 });
  const outcome = await db.transaction(async tx => {
   const [application] = await tx.select().from(nannyApplications).where(and(eq(nannyApplications.id,id),eq(nannyApplications.userId,user.id))).for("update");
   if (!application) return 404;
   if (!EDITABLE_APPLICATION_STATUSES.includes(application.status)) return 409;
   const previous = parseApplication(application.bio);
   if (!previous) return 409;
   const cleanValues = Object.fromEntries(fields.map(field => [field.name, values[field.name] || ""]));
   const name = `${values.firstName.trim()} ${values.lastName.trim()}`;
   await tx.update(nannyApplications).set({ name, email: user.email, phone: values.phone.trim(), city: values.homeAddress.trim(), experienceYears: Number(values.yearsInChildcare), availability: `${values.availableStartDate}; ${values.commitmentLength}`, services: APPLICATION_STEPS[2].fields.filter(field => field.type === "checkbox" && values[field.name] === "Yes").map(field => field.label).join(", ") || "Not specified", certifications: values.hasCertifications, bio: JSON.stringify({ ...previous, values: cleanValues, references, workHistory, languages }), status: "submitted" }).where(and(eq(nannyApplications.id,id),eq(nannyApplications.userId,user.id)));
   await tx.delete(applicationScreenings).where(eq(applicationScreenings.applicationId,id));
   await tx.insert(reviewEvents).values({reviewerId:user.id,nannyApplicationId:id,fromStatus:application.status,toStatus:"submitted",note:"Applicant resubmitted application; screening must be completed again."});
   await tx.update(users).set({ name, phone: values.phone.trim(), updatedAt: new Date() }).where(eq(users.id,user.id));
   return 200;
  });
  if (outcome !== 200) return NextResponse.json({ error: outcome === 404 ? "Application not found." : "Contact our team to correct an application already in screening." }, { status: outcome });
  return NextResponse.json({ ok: true });
 } catch { return NextResponse.json({ error: "Could not save application changes." }, { status: 500 }); }
}
