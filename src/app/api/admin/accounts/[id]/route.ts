import { randomBytes } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, isNull, or, gte, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  accountTokens, adminAccess, applicationScreenings, bookingAssignments, careBookings,
  caregiverCredentials, conversationAttachments, conversationMessages, conversationReads,
  conversations, credentialEvents, credentialReminders, familyRequests, mailJobs,
  membershipCycles, nannyApplications, nannyMatches, reviewEvents, stripeBilling,
  trainingCertificates, trainingEnrollments, trainingEvents, users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { OPEN_BOOKING_STATUSES } from "@/lib/bookings";
import { adminCan } from "@/lib/admin-permissions";
import { isAllowedRequestOrigin } from "@/lib/request-origin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedRequestOrigin(req)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const { id } = await params, body = await req.json();
    if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 255 || typeof body.phone !== "string" || body.phone.length > 50 || typeof body.version !== "string") return NextResponse.json({ error: "Enter valid contact details." }, { status: 400 });
    const status = await db.transaction(async tx => {
      const [record] = await tx.select().from(users).where(eq(users.id, id)).for("update");
      if (!record || (!(["nanny", "family"].includes(record.role)) && record.id !== actor.id)) return 404;
      if (record.id !== actor.id && !await adminCan(actor, record.role === "family" ? "families.edit" : "nannies.edit", tx)) return 403;
      if (record.updatedAt.toISOString() !== body.version) return 409;
      await tx.update(users).set({ name: body.name.trim(), phone: body.phone.trim() || null, updatedAt: new Date(Math.max(Date.now(), record.updatedAt.getTime() + 1000)) }).where(eq(users.id, id));
      await tx.insert(reviewEvents).values({ reviewerId: actor.id, fromStatus: "account_contact", toStatus: "account_contact", note: `Account ${id}: contact details updated.` });
      return 200;
    });
    return NextResponse.json(status === 200 ? { ok: true } : { error: status === 403 ? "You do not have permission to edit this account." : status === 409 ? "Account changed. Refresh before saving." : "Account not found." }, { status });
  } catch { return NextResponse.json({ error: "Could not save account." }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedRequestOrigin(req)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const filesToRemove: string[] = [];
  try {
    const { id } = await params, body = await req.json();
    if (typeof body.version !== "string" || typeof body.confirmation !== "string") return NextResponse.json({ error: "Confirm the account email and retry." }, { status: 400 });
    const result = await db.transaction(async tx => {
      const [record] = await tx.select().from(users).where(eq(users.id, id)).for("update");
      if (!record || !["family", "nanny"].includes(record.role)) return { status: 404 as const, error: "Account not found." };
      const permission = record.role === "family" ? "families.delete" : "nannies.delete";
      if (!await adminCan(actor, permission, tx)) return { status: 403 as const, error: "You do not have permission to delete this account." };
      if (record.updatedAt.toISOString() !== body.version || record.email !== body.confirmation.trim()) return { status: 409 as const, error: "The account changed or the email did not match. Refresh and try again." };

      const today = new Date().toISOString().slice(0, 10);
      const activeBooking = await tx.select({ id: careBookings.id }).from(careBookings).where(and(
        or(eq(careBookings.familyId, id), eq(careBookings.caregiverId, id)),
        inArray(careBookings.status, OPEN_BOOKING_STATUSES),
      )).limit(1);
      if (activeBooking.length) return { status: 409 as const, error: "Resolve or close this account’s active care bookings before deletion." };

      const [billing] = await tx.select({ status: stripeBilling.status }).from(stripeBilling).where(eq(stripeBilling.userId, id)).limit(1);
      if (billing && ["active", "trialing", "past_due", "unpaid", "paused"].includes(billing.status)) return { status: 409 as const, error: "Cancel or resolve this account’s Stripe subscription before deleting it." };

      if (record.role === "family") {
        const currentCycle = await tx.select({ id: membershipCycles.id }).from(membershipCycles).where(and(eq(membershipCycles.userId, id), gte(membershipCycles.endDate, today), isNull(membershipCycles.cancelledAt))).limit(1);
        if (currentCycle.length) return { status: 409 as const, error: "This family has an active membership. End it before deleting the account." };
      } else {
        const pendingAssignment = await tx.select({ id: bookingAssignments.id }).from(bookingAssignments)
          .innerJoin(careBookings, eq(bookingAssignments.bookingId, careBookings.id))
          .where(and(eq(bookingAssignments.caregiverId, id), eq(bookingAssignments.status, "invited"), inArray(careBookings.status, OPEN_BOOKING_STATUSES)))
          .limit(1);
        if (pendingAssignment.length) return { status: 409 as const, error: "Resolve this nanny’s pending booking invitations before deleting the account." };
        const currentPlacement = await tx.select({ id: nannyMatches.id }).from(nannyMatches)
          .innerJoin(nannyApplications, eq(nannyMatches.nannyApplicationId, nannyApplications.id))
          .where(and(or(eq(nannyApplications.userId, id), eq(nannyApplications.email, record.email)), eq(nannyMatches.status, "placed"), or(gte(nannyMatches.placementStart, today), isNull(nannyMatches.placementStart))))
          .limit(1);
        if (currentPlacement.length) return { status: 409 as const, error: "Resolve this nanny’s current placement before deleting the account." };
      }

      const apps = record.role === "nanny" ? await tx.select({ id: nannyApplications.id, bio: nannyApplications.bio }).from(nannyApplications).where(or(eq(nannyApplications.userId, id), eq(nannyApplications.email, record.email))) : [];
      const requests = record.role === "family" ? await tx.select({ id: familyRequests.id }).from(familyRequests).where(or(eq(familyRequests.userId, id), eq(familyRequests.email, record.email))) : [];
      const credentials = record.role === "nanny" ? await tx.select({ id: caregiverCredentials.id, storedName: caregiverCredentials.storedName }).from(caregiverCredentials).where(eq(caregiverCredentials.userId, id)) : [];
      for (const credential of credentials) if (/^[a-f0-9-]{36}\.pdf$/i.test(credential.storedName)) filesToRemove.push(path.join(process.cwd(), ".data", "credentials", credential.storedName));
      for (const app of apps) {
        try {
          const parsed = JSON.parse(app.bio || "") as { attachments?: { storedName?: string }[] };
          for (const attachment of parsed.attachments ?? []) if (typeof attachment.storedName === "string" && /^[a-f0-9-]{36}\.(jpg|jpeg|png|webp|pdf|doc|docx)$/i.test(attachment.storedName)) filesToRemove.push(path.join(process.cwd(), ".data", "nanny-uploads", attachment.storedName));
        } catch { /* malformed legacy application data has no safe file names to remove */ }
      }

      const accountConversations = await tx.select({ id: conversations.id }).from(conversations).where(or(eq(conversations.memberId, id), eq(conversations.familyId, id), eq(conversations.nannyId, id)));
      const conversationIds = accountConversations.map(row => row.id);
      if (conversationIds.length) {
        const uploads = await tx.select({ storedName: conversationAttachments.storedName }).from(conversationAttachments).where(inArray(conversationAttachments.conversationId, conversationIds));
        for (const upload of uploads) if (/^[a-f0-9-]{36}\.(jpg|png|webp|pdf|docx|txt)$/i.test(upload.storedName)) filesToRemove.push(path.join(process.cwd(), ".data", "chat-uploads", upload.storedName));
        await tx.delete(conversationAttachments).where(inArray(conversationAttachments.conversationId, conversationIds));
        await tx.delete(conversationReads).where(inArray(conversationReads.conversationId, conversationIds));
        await tx.delete(conversationMessages).where(inArray(conversationMessages.conversationId, conversationIds));
        await tx.delete(conversations).where(inArray(conversations.id, conversationIds));
      }

      if (record.role === "family") {
        for (const request of requests) {
          await tx.update(familyRequests).set({ userId: null, name: "Deleted family", email: `deleted+${request.id}@deleted.invalid`, phone: null, zip: null, town: null, childrenInfo: null, schedule: null, startDate: null, budget: null, message: null }).where(eq(familyRequests.id, request.id));
          await tx.update(reviewEvents).set({ note: null }).where(eq(reviewEvents.familyRequestId, request.id));
          await tx.update(nannyMatches).set({ sharedNote: null }).where(eq(nannyMatches.familyRequestId, request.id));
        }
        await tx.update(careBookings).set({ town: "Removed", address: "Removed", careNeeds: "Removed" }).where(eq(careBookings.familyId, id));
      } else {
        for (const app of apps) {
          await tx.update(nannyApplications).set({ userId: null, name: "Deleted nanny", email: `deleted+${app.id}@deleted.invalid`, phone: null, city: null, experienceYears: null, certifications: null, availability: null, services: null, bio: null }).where(eq(nannyApplications.id, app.id));
          await tx.update(reviewEvents).set({ note: null }).where(eq(reviewEvents.nannyApplicationId, app.id));
          await tx.update(nannyMatches).set({ sharedNote: null }).where(eq(nannyMatches.nannyApplicationId, app.id));
          await tx.delete(applicationScreenings).where(eq(applicationScreenings.applicationId, app.id));
        }
        for (const credential of credentials) {
          await tx.delete(credentialReminders).where(eq(credentialReminders.credentialId, credential.id));
          await tx.delete(credentialEvents).where(eq(credentialEvents.credentialId, credential.id));
        }
        await tx.delete(caregiverCredentials).where(eq(caregiverCredentials.userId, id));
        await tx.update(careBookings).set({ caregiverId: null }).where(eq(careBookings.caregiverId, id));
        await tx.update(trainingEnrollments).set({ reflection: null, feedback: null }).where(eq(trainingEnrollments.userId, id));
        const enrollments = await tx.select({ id: trainingEnrollments.id }).from(trainingEnrollments).where(eq(trainingEnrollments.userId, id));
        for (const enrollment of enrollments) {
          await tx.update(trainingCertificates).set({ traineeName: "Deleted account" }).where(eq(trainingCertificates.enrollmentId, enrollment.id));
          await tx.update(trainingEvents).set({ note: null }).where(eq(trainingEvents.enrollmentId, enrollment.id));
        }
      }

      await tx.delete(accountTokens).where(eq(accountTokens.userId, id));
      await tx.delete(adminAccess).where(eq(adminAccess.userId, id));
      await tx.delete(mailJobs).where(eq(mailJobs.userId, id));
      await tx.delete(mailJobs).where(like(mailJobs.body, `%${record.email}%`));
      await tx.update(reviewEvents).set({ note: null }).where(like(reviewEvents.note, `Account ${id}:%`));
      await tx.update(users).set({
        role: "deleted", name: "Deleted account", email: `deleted+${id}@deleted.invalid`, phone: null,
        passwordHash: randomBytes(48).toString("hex"), sessionVersion: record.sessionVersion + 1,
        emailVerifiedAt: null, updatedAt: new Date(Math.max(Date.now(), record.updatedAt.getTime() + 1000)),
      }).where(eq(users.id, id));
      await tx.insert(reviewEvents).values({ reviewerId: actor.id, fromStatus: "account_active", toStatus: "account_deleted", note: `Account ${id} anonymized; login revoked by administrator ${actor.id}.` });
      return { status: 200 as const, error: "" };
    });
    if (result.status === 200) {
      await Promise.all(filesToRemove.map(file => unlink(file).catch(() => undefined)));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Could not delete account. No account changes were saved." }, { status: 500 });
  }
}
