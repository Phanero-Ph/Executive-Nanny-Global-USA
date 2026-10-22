CREATE TABLE `agency_fee_settings` (
	`id` int NOT NULL,
	`search_cents` int NOT NULL DEFAULT 5000,
	`placement_cents` int NOT NULL DEFAULT 5000,
	`revision` int NOT NULL DEFAULT 0,
	`updated_by` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agency_fee_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agency_fee_settings` ADD CONSTRAINT `agency_fee_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;