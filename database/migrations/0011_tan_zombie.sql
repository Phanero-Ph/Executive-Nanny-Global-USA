CREATE TABLE `caregiver_fees` (
	`id` varchar(36) NOT NULL,
	`request_id` varchar(36) NOT NULL,
	`kind` varchar(20) NOT NULL,
	`amount_cents` int NOT NULL DEFAULT 5000,
	`status` varchar(20) NOT NULL DEFAULT 'unpaid',
	`checkout_key` varchar(36) NOT NULL,
	`checkout_session_id` varchar(255),
	`payment_intent_id` varchar(255),
	`refunded_cents` int NOT NULL DEFAULT 0,
	`paid_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caregiver_fees_id` PRIMARY KEY(`id`),
	CONSTRAINT `caregiver_fees_checkout_session_id_unique` UNIQUE(`checkout_session_id`),
	CONSTRAINT `caregiver_fees_payment_intent_id_unique` UNIQUE(`payment_intent_id`),
	CONSTRAINT `caregiver_fee_request_kind_unique` UNIQUE(`request_id`,`kind`)
);
--> statement-breakpoint
ALTER TABLE `family_requests` ADD `care_category` varchar(20) DEFAULT 'nanny' NOT NULL;--> statement-breakpoint
ALTER TABLE `family_requests` ADD `membership_cycle_id` varchar(36);--> statement-breakpoint
ALTER TABLE `family_requests` ADD `submission_key` varchar(36);--> statement-breakpoint
ALTER TABLE `family_requests` ADD `placement_fee_status` varchar(30) DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `family_requests` ADD CONSTRAINT `family_submission_unique` UNIQUE(`user_id`,`submission_key`);--> statement-breakpoint
ALTER TABLE `caregiver_fees` ADD CONSTRAINT `caregiver_fees_request_id_family_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `family_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `family_membership_cycle_idx` ON `family_requests` (`membership_cycle_id`);