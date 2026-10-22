CREATE TABLE `agency_chat_settings` (
	`id` int NOT NULL,
	`family_enabled` int NOT NULL DEFAULT 1,
	`nanny_enabled` int NOT NULL DEFAULT 1,
	`revision` int NOT NULL DEFAULT 0,
	`updated_by` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agency_chat_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agency_chat_settings` ADD CONSTRAINT `agency_chat_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;