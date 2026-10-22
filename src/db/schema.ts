import { randomUUID } from "node:crypto";
import { mysqlTable, varchar, text, longtext, timestamp, datetime, int, uniqueIndex, index } from "drizzle-orm/mysql-core";

/** Account roles across the EGN platform */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  role: varchar("role", { length: 20 }).notNull().default("family"), // family | nanny | admin
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  sessionVersion: int("session_version").notNull().default(0),
  emailVerifiedAt: datetime("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Family care requests â€” lifecycle from lead to placement (PRD Â§6.2) */
export const familyRequests = mysqlTable("family_requests", {
  id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  town: varchar("town", { length: 255 }),
  serviceType: varchar("service_type", { length: 255 }).notNull(),
  childrenInfo: text("children_info"),
  schedule: text("schedule"),
  startDate: varchar("start_date", { length: 30 }),
  budget: varchar("budget", { length: 255 }),
  message: text("message"),
  status: varchar("status", { length: 50 }).notNull().default("lead"), // lead â†’ search_fee_invoiced â†’ search_fee_paid â†’ searching â†’ shortlist â†’ interviews â†’ placed
  searchFeeStatus: varchar("search_fee_status", { length: 30 }).notNull().default("unpaid"),
  careCategory: varchar("care_category", { length: 20 }).notNull().default("nanny"), // legacy codes: nanny=babysitter subscription, caregiver=nanny fees
  placementRateBps:int("placement_rate_bps"),
  membershipCycleId: varchar("membership_cycle_id", { length: 36 }),
  submissionKey: varchar("submission_key", { length: 36 }),
  placementFeeStatus: varchar("placement_fee_status", { length: 30 }).notNull().default("unpaid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [uniqueIndex("family_submission_unique").on(table.userId, table.submissionKey), index("family_membership_cycle_idx").on(table.membershipCycleId)]);

/** Nanny / caregiver applications â€” lifecycle per PRD Â§6.1 */
export const nannyApplications = mysqlTable("nanny_applications", {
  id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  city: text("city"),
  experienceYears: int("experience_years"),
  certifications: text("certifications"),
  availability: text("availability"),
  services: text("services"),
  bio: longtext("bio"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft â†’ submitted â†’ document_review â†’ screening â†’ interview â†’ subscription_pending â†’ active
  subscriptionStatus: varchar("subscription_status", { length: 30 }).notNull().default("inactive"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Contact / support inquiries */
export const contactMessages = mysqlTable("contact_messages", {
  id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: text("subject"),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Newsletter subscribers */
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type FamilyRequest = typeof familyRequests.$inferSelect;
export type NannyApplication = typeof nannyApplications.$inferSelect;

/** Internal review history; never included in family/nanny responses. */
export const reviewEvents = mysqlTable("review_events", {
 id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
 reviewerId: varchar("reviewer_id", { length: 36 }).notNull().references(() => users.id),
 familyRequestId: varchar("family_request_id", { length: 36 }).references(() => familyRequests.id),
 nannyApplicationId: varchar("nanny_application_id", { length: 36 }).references(() => nannyApplications.id),
 note: text("note"),
 fromStatus: varchar("from_status", { length: 50 }).notNull(),
 toStatus: varchar("to_status", { length: 50 }).notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountTokens = mysqlTable("account_tokens", {
 id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
 userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
 tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
 purpose: varchar("purpose", { length: 20 }).notNull(),
 expiresAt: datetime("expires_at").notNull(),
 usedAt: datetime("used_at"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const mailJobs = mysqlTable("mail_jobs", {
 id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
 userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }),
 recipient: varchar("recipient", { length: 254 }).notNull(),
 subject: varchar("subject", { length: 255 }).notNull(),
 body: longtext("body").notNull(),
 status: varchar("status", { length: 20 }).notNull().default("pending"),
 attempts: int("attempts").notNull().default(0),
 attemptedAt: datetime("attempted_at"),
 sentAt: datetime("sent_at"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const recoveryLimits = mysqlTable("recovery_limits", {
 key: varchar("limiter_key", { length: 64 }).primaryKey(),
 count: int("request_count").notNull().default(1),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nannyMatches = mysqlTable("nanny_matches", {
 id: varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
 familyRequestId: varchar("family_request_id", { length: 36 }).notNull().references(() => familyRequests.id),
 nannyApplicationId: varchar("nanny_application_id", { length: 36 }).notNull().references(() => nannyApplications.id),
 createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
 status: varchar("status", { length: 20 }).notNull().default("shortlisted"),
 interviewAt: datetime("interview_at"),
 placementStart: varchar("placement_start", { length: 10 }),
 sharedNote: text("shared_note"),
 revision: int("revision").notNull().default(0),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
}, table => [uniqueIndex("match_request_application_unique").on(table.familyRequestId,table.nannyApplicationId)]);

/** Monthly membership cycles and immutable offline payment receipts. */
export const membershipCycles = mysqlTable("membership_cycles", {
 source: varchar("source", {length:20}).notNull().default("manual"),
 stripeInvoiceId: varchar("stripe_invoice_id", {length:255}).unique(),
 periodStart: datetime("period_start"),
 periodEnd: datetime("period_end"),
 id: varchar("id", {length:36}).$defaultFn(() => randomUUID()).primaryKey(),
 userId: varchar("user_id", {length:36}).notNull().references(() => users.id),
 plan: varchar("plan", {length:30}).notNull(),
 amountCents: int("amount_cents").notNull(),
 startDate: varchar("start_date", {length:10}).notNull(),
 endDate: varchar("end_date", {length:10}).notNull(),
 cancelledAt: datetime("cancelled_at"),
 revision: int("revision").notNull().default(0),
 createdBy: varchar("created_by", {length:36}).notNull().references(() => users.id),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const membershipPayments = mysqlTable("membership_payments", {
 refundedCents: int("refunded_cents").notNull().default(0),
 id: varchar("id", {length:36}).$defaultFn(() => randomUUID()).primaryKey(),
 cycleId: varchar("cycle_id", {length:36}).notNull().references(() => membershipCycles.id),
 amountCents: int("amount_cents").notNull(),
 reference: varchar("reference", {length:100}).notNull().unique(),
 method: varchar("method", {length:30}).notNull(),
 paidDate: varchar("paid_date", {length:10}).notNull(),
 recordedBy: varchar("recorded_by", {length:36}).notNull().references(() => users.id),
 voidedAt: datetime("voided_at"),
 voidedBy: varchar("voided_by", {length:36}).references(() => users.id),
 voidReason: varchar("void_reason", {length:500}),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const membershipReminders = mysqlTable("membership_reminders", {
 cycleId: varchar("cycle_id", {length:36}).primaryKey().references(() => membershipCycles.id),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stripeBilling = mysqlTable("stripe_billing", {
 userId: varchar("user_id", {length:36}).primaryKey().references(() => users.id),
 customerId: varchar("customer_id", {length:255}).notNull().unique(),
 subscriptionId: varchar("subscription_id", {length:255}).unique(),
 status: varchar("status", {length:40}).notNull().default("none"),
 plan: varchar("plan", {length:30}),
 periodEnd: datetime("period_end"),
 cancelAtPeriodEnd: int("cancel_at_period_end").notNull().default(0),
 checkoutKey: varchar("checkout_key", {length:36}),
 checkoutPlan: varchar("checkout_plan", {length:30}),
 checkoutSessionId: varchar("checkout_session_id", {length:255}),
 updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});
export const stripeEvents = mysqlTable("stripe_events", {
 id: varchar("id", {length:255}).primaryKey(),
 type: varchar("type", {length:100}).notNull(),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careBookings = mysqlTable("care_bookings", {
 id: varchar("id", {length:36}).$defaultFn(() => randomUUID()).primaryKey(),
 familyId: varchar("family_id", {length:36}).notNull().references(() => users.id),
 cycleId: varchar("cycle_id", {length:36}).notNull().references(() => membershipCycles.id),
 requestKey: varchar("request_key", {length:36}).notNull(),
 startsAt: datetime("starts_at").notNull(),
 endsAt: datetime("ends_at").notNull(),
 town: varchar("town", {length:255}).notNull(),
 address: text("address").notNull(),
 careNeeds: text("care_needs").notNull(),
 status: varchar("status", {length:30}).notNull().default("requested"),
 caregiverId: varchar("caregiver_id", {length:36}).references(() => users.id),
 applicationId: varchar("application_id", {length:36}).references(() => nannyApplications.id),
 consumesCredit: int("consumes_credit").notNull().default(1),
 revision: int("revision").notNull().default(0),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
}, table => [uniqueIndex("booking_family_request_unique").on(table.familyId,table.requestKey),index("booking_family_dates").on(table.familyId,table.startsAt,table.endsAt),index("booking_caregiver_dates").on(table.caregiverId,table.startsAt,table.endsAt),index("booking_cycle_credit").on(table.cycleId,table.consumesCredit)]);
export const bookingAssignments = mysqlTable("booking_assignments", {
 id: varchar("id", {length:36}).$defaultFn(() => randomUUID()).primaryKey(),
 bookingId: varchar("booking_id", {length:36}).notNull().references(() => careBookings.id),
 caregiverId: varchar("caregiver_id", {length:36}).notNull().references(() => users.id),
 status: varchar("status", {length:30}).notNull().default("invited"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
 respondedAt: datetime("responded_at"),
},table=>[index("booking_assignment_caregiver").on(table.caregiverId)]);
export const bookingEvents = mysqlTable("booking_events", {
 id: varchar("id", {length:36}).$defaultFn(() => randomUUID()).primaryKey(),
 bookingId: varchar("booking_id", {length:36}).notNull().references(() => careBookings.id),
 actorId: varchar("actor_id", {length:36}).notNull().references(() => users.id),
 action: varchar("action", {length:30}).notNull(),
 note: text("note"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const caregiverCredentials = mysqlTable("caregiver_credentials", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 userId:varchar("user_id",{length:36}).notNull().references(()=>users.id),
 kind:varchar("kind",{length:30}).notNull(),
 fileName:varchar("file_name",{length:255}).notNull(),
 storedName:varchar("stored_name",{length:50}).notNull(),
 status:varchar("status",{length:20}).notNull().default("pending"),
 expiresOn:varchar("expires_on",{length:10}),
 feedback:text("feedback"),
 revision:int("revision").notNull().default(0),
 reviewedBy:varchar("reviewed_by",{length:36}).references(()=>users.id),
 reviewedAt:datetime("reviewed_at"),
 createdAt:timestamp("created_at").defaultNow().notNull(),
},table=>[uniqueIndex("caregiver_credential_kind_unique").on(table.userId,table.kind)]);
export const credentialEvents = mysqlTable("credential_events", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 credentialId:varchar("credential_id",{length:36}).notNull().references(()=>caregiverCredentials.id),
 actorId:varchar("actor_id",{length:36}).notNull().references(()=>users.id),
 action:varchar("action",{length:20}).notNull(),
 note:text("note"),
 createdAt:timestamp("created_at").defaultNow().notNull(),
});
export const credentialReminders = mysqlTable("credential_reminders", {
 credentialId:varchar("credential_id",{length:36}).notNull().references(()=>caregiverCredentials.id),
 revision:int("revision").notNull(),
 createdAt:timestamp("created_at").defaultNow().notNull(),
},table=>[uniqueIndex("credential_reminder_revision_unique").on(table.credentialId,table.revision)]);

export const conversations = mysqlTable("conversations", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 kind:varchar("kind",{length:10}).notNull(),
 sourceId:varchar("source_id",{length:36}).notNull(),
 memberId:varchar("member_id",{length:36}).references(()=>users.id),
 familyId:varchar("family_id",{length:36}).references(()=>users.id),
 nannyId:varchar("nanny_id",{length:36}).references(()=>users.id),
 lastSequence:int("last_sequence").notNull().default(0),
 updatedAt:datetime("updated_at").notNull().$defaultFn(()=>new Date()),
 createdAt:timestamp("created_at").defaultNow().notNull(),
},table=>[uniqueIndex("conversation_member_unique").on(table.memberId),uniqueIndex("conversation_context_caregiver_unique").on(table.kind,table.sourceId,table.nannyId),index("conversation_family_updated").on(table.familyId,table.updatedAt),index("conversation_nanny_updated").on(table.nannyId,table.updatedAt)]);
export const conversationMessages = mysqlTable("conversation_messages", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 conversationId:varchar("conversation_id",{length:36}).notNull().references(()=>conversations.id),
 senderId:varchar("sender_id",{length:36}).notNull().references(()=>users.id),
 requestKey:varchar("request_key",{length:36}).notNull(),
 sequence:int("sequence").notNull(),
 body:text("body").notNull(),
 replyToId:varchar("reply_to_id",{length:36}),
 createdAt:timestamp("created_at").defaultNow().notNull(),
},table=>[uniqueIndex("conversation_message_sequence_unique").on(table.conversationId,table.sequence),uniqueIndex("conversation_message_request_unique").on(table.conversationId,table.senderId,table.requestKey)]);
export const conversationReads = mysqlTable("conversation_reads", {
 conversationId:varchar("conversation_id",{length:36}).notNull().references(()=>conversations.id),
 userId:varchar("user_id",{length:36}).notNull().references(()=>users.id),
 lastSequence:int("last_sequence").notNull().default(0),
},table=>[uniqueIndex("conversation_read_user_unique").on(table.conversationId,table.userId)]);

export const conversationAttachments = mysqlTable("conversation_attachments", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 conversationId:varchar("conversation_id",{length:36}).notNull().references(()=>conversations.id),
 uploaderId:varchar("uploader_id",{length:36}).notNull().references(()=>users.id),
 messageId:varchar("message_id",{length:36}).references(()=>conversationMessages.id),
 uploadKey:varchar("upload_key",{length:36}).notNull(),
 contentHash:varchar("content_hash",{length:64}).notNull(),
 fileName:varchar("file_name",{length:180}).notNull(),
 storedName:varchar("stored_name",{length:80}).notNull(),
 mimeType:varchar("mime_type",{length:100}).notNull(),
 sizeBytes:int("size_bytes").notNull(),
 createdAt:datetime("created_at").notNull().$defaultFn(()=>new Date()),
},table=>[uniqueIndex("chat_upload_retry_unique").on(table.conversationId,table.uploaderId,table.uploadKey),index("chat_attachment_message").on(table.messageId),index("chat_upload_expiry").on(table.messageId,table.createdAt),index("chat_upload_owner").on(table.uploaderId,table.createdAt)]);

export const trainingCourses = mysqlTable("training_courses", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 title:varchar("title",{length:200}).notNull(),
 summary:text("summary").notNull(),
 instructor:varchar("instructor",{length:200}).notNull(),
 duration:varchar("duration",{length:100}).notNull(),
 status:varchar("status",{length:20}).notNull().default("draft"),
 revision:int("revision").notNull().default(0),
 createdBy:varchar("created_by",{length:36}).notNull().references(()=>users.id),
 createdAt:timestamp("created_at").defaultNow().notNull(),
});
export const trainingLessons = mysqlTable("training_lessons", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 courseId:varchar("course_id",{length:36}).notNull().references(()=>trainingCourses.id),
 title:varchar("title",{length:200}).notNull(),
 content:longtext("content").notNull(),
 position:int("position").notNull(),
 fileName:varchar("file_name",{length:255}),
 storedName:varchar("stored_name",{length:50}),
},table=>[uniqueIndex("training_lesson_position_unique").on(table.courseId,table.position)]);
export const trainingEnrollments = mysqlTable("training_enrollments", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 courseId:varchar("course_id",{length:36}).notNull().references(()=>trainingCourses.id),
 userId:varchar("user_id",{length:36}).notNull().references(()=>users.id),
 status:varchar("status",{length:30}).notNull().default("enrolled"),
 reflection:text("reflection"),
 feedback:text("feedback"),
 revision:int("revision").notNull().default(0),
 createdAt:timestamp("created_at").defaultNow().notNull(),
},table=>[uniqueIndex("training_enrollment_unique").on(table.courseId,table.userId)]);
export const trainingProgress = mysqlTable("training_progress", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 enrollmentId:varchar("enrollment_id",{length:36}).notNull().references(()=>trainingEnrollments.id),
 lessonId:varchar("lesson_id",{length:36}).notNull().references(()=>trainingLessons.id),
 completedAt:timestamp("completed_at").defaultNow().notNull(),
},table=>[uniqueIndex("training_progress_unique").on(table.enrollmentId,table.lessonId)]);
export const trainingCertificates = mysqlTable("training_certificates", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 enrollmentId:varchar("enrollment_id",{length:36}).notNull().references(()=>trainingEnrollments.id),
 courseTitle:varchar("course_title",{length:200}).notNull(),
 traineeName:varchar("trainee_name",{length:255}).notNull(),
 issuerName:varchar("issuer_name",{length:255}).notNull(),
 issuedBy:varchar("issued_by",{length:36}).notNull().references(()=>users.id),
 issuedAt:timestamp("issued_at").defaultNow().notNull(),
 revokedAt:datetime("revoked_at"),
 revokedBy:varchar("revoked_by",{length:36}).references(()=>users.id),
 revocationReason:text("revocation_reason"),
});
export const trainingEvents = mysqlTable("training_events", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 courseId:varchar("course_id",{length:36}).notNull().references(()=>trainingCourses.id),
 enrollmentId:varchar("enrollment_id",{length:36}).references(()=>trainingEnrollments.id),
 actorId:varchar("actor_id",{length:36}).notNull().references(()=>users.id),
 action:varchar("action",{length:30}).notNull(),
 note:text("note"),
 createdAt:timestamp("created_at").defaultNow().notNull(),
});

/** Company fees belong to one caregiver request and never grant subscription access. */
export const caregiverFees = mysqlTable("caregiver_fees", {
 id: varchar("id", {length:36}).$defaultFn(() => randomUUID()).primaryKey(),
 requestId: varchar("request_id", {length:36}).notNull().references(() => familyRequests.id),
 kind: varchar("kind", {length:20}).notNull(),
 amountCents: int("amount_cents").notNull().default(30000),
 annualSalaryCents:int("annual_salary_cents"),
 placementRateBps:int("placement_rate_bps"),
 matchId:varchar("match_id",{length:36}).references(()=>nannyMatches.id),
 quoteRevision:int("quote_revision").notNull().default(0),
 status: varchar("status", {length:20}).notNull().default("unpaid"),
 checkoutKey: varchar("checkout_key", {length:36}).notNull(),
 checkoutSessionId: varchar("checkout_session_id", {length:255}).unique(),
 paymentIntentId: varchar("payment_intent_id", {length:255}).unique(),
 refundedCents: int("refunded_cents").notNull().default(0),
 paidAt: datetime("paid_at"),
 createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [uniqueIndex("caregiver_fee_request_kind_unique").on(table.requestId,table.kind)]);

/** Private recruitment readiness and applicant-facing decision feedback. */
export const applicationScreenings = mysqlTable("application_screenings", {
 applicationId: varchar("application_id", {length:36}).primaryKey().references(()=>nannyApplications.id,{onDelete:"cascade"}),
 applicationDigest: varchar("application_digest", {length:64}).notNull(),
 checks: text("checks").notNull(),
 referenceReviews: text("reference_reviews").notNull(),
 feedback: text("feedback"),
 revision: int("revision").notNull().default(0),
 reviewedBy: varchar("reviewed_by", {length:36}).notNull().references(()=>users.id),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Administrator-controlled caregiver pricing. Issued fees keep their own amount. */
export const agencyFeeSettings = mysqlTable("agency_fee_settings", {
 id: int("id").primaryKey(),
 searchCents: int("search_cents").notNull().default(30000),
 placementRateBps:int("placement_rate_bps").notNull().default(1500),
 placementCents: int("placement_cents").notNull().default(5000),
 revision: int("revision").notNull().default(0),
 updatedBy: varchar("updated_by", {length:36}).references(()=>users.id),
 updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Role-wide agency chat availability; conversation history is retained. */
export const agencyChatSettings = mysqlTable("agency_chat_settings", {
 id:int("id").primaryKey(),
 familyEnabled:int("family_enabled").notNull().default(1),
 nannyEnabled:int("nanny_enabled").notNull().default(1),
 revision:int("revision").notNull().default(0),
 updatedBy:varchar("updated_by",{length:36}).references(()=>users.id),
 updatedAt:timestamp("updated_at").defaultNow().notNull(),
});

/** Explicit administrative access; absence never grants permissions. */
export const adminAccess = mysqlTable("admin_access", {
 userId:varchar("user_id",{length:36}).primaryKey().references(()=>users.id),
 superAdmin:int("super_admin").notNull().default(0),
 status:varchar("status",{length:20}).notNull().default("invited"),
 roleLabel:varchar("role_label",{length:80}).notNull().default("Custom"),
 permissions:text("permissions").notNull(),
 revision:int("revision").notNull().default(0),
 updatedAt:timestamp("updated_at").defaultNow().notNull(),
});
export const adminInvitations = mysqlTable("admin_invitations", {
 id:varchar("id",{length:36}).$defaultFn(()=>randomUUID()).primaryKey(),
 userId:varchar("user_id",{length:36}).notNull().references(()=>users.id),
 tokenHash:varchar("token_hash",{length:64}).notNull().unique(),
 expiresAt:datetime("expires_at").notNull(),
 consumedAt:datetime("consumed_at"),
 revokedAt:datetime("revoked_at"),
 createdBy:varchar("created_by",{length:36}).notNull().references(()=>users.id),
 createdAt:timestamp("created_at").defaultNow().notNull(),
});
export const adminAccessLock = mysqlTable("admin_access_lock",{id:int("id").primaryKey()});
