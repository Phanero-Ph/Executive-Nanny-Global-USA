UPDATE `nanny_matches` SET `status`='shortlisted', `revision`=`revision`+1, `updated_at`=UTC_TIMESTAMP() WHERE `status`='interview';
--> statement-breakpoint
UPDATE `family_requests` SET `status`='shortlist' WHERE `status`='interviews';
