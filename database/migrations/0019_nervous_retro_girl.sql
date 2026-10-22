ALTER TABLE `agency_fee_settings` MODIFY COLUMN `search_cents` int NOT NULL DEFAULT 30000;--> statement-breakpoint
ALTER TABLE `caregiver_fees` MODIFY COLUMN `amount_cents` int NOT NULL DEFAULT 30000;--> statement-breakpoint
ALTER TABLE `agency_fee_settings` ADD `placement_rate_bps` int DEFAULT 1500 NOT NULL;--> statement-breakpoint
ALTER TABLE `caregiver_fees` ADD `annual_salary_cents` int;--> statement-breakpoint
ALTER TABLE `caregiver_fees` ADD `placement_rate_bps` int;--> statement-breakpoint
ALTER TABLE `caregiver_fees` ADD `match_id` varchar(36);--> statement-breakpoint
ALTER TABLE `caregiver_fees` ADD `quote_revision` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `family_requests` ADD `placement_rate_bps` int;--> statement-breakpoint
ALTER TABLE `caregiver_fees` ADD CONSTRAINT `caregiver_fees_match_id_nanny_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `nanny_matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE `agency_fee_settings` SET `search_cents` = 30000, `placement_rate_bps` = 1500, `revision` = `revision` + 1;--> statement-breakpoint
UPDATE `family_requests` SET `placement_rate_bps` = 1500 WHERE `care_category` = 'caregiver';--> statement-breakpoint
UPDATE `caregiver_fees` SET `amount_cents` = 30000 WHERE `kind` = 'search' AND `paid_at` IS NULL AND `checkout_session_id` IS NULL;--> statement-breakpoint
DELETE FROM `caregiver_fees` WHERE `kind` = 'placement' AND `paid_at` IS NULL AND `checkout_session_id` IS NULL;
