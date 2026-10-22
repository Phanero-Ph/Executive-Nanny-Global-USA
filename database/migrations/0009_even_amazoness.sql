CREATE TABLE `caregiver_credentials` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`kind` varchar(30) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`stored_name` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`expires_on` varchar(10),
	`feedback` text,
	`revision` int NOT NULL DEFAULT 0,
	`reviewed_by` varchar(36),
	`reviewed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `caregiver_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `caregiver_credential_kind_unique` UNIQUE(`user_id`,`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `credential_events` (
	`id` varchar(36) NOT NULL,
	`credential_id` varchar(36) NOT NULL,
	`actor_id` varchar(36) NOT NULL,
	`action` varchar(20) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `credential_events_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `credential_reminders` (
	`credential_id` varchar(36) NOT NULL,
	`revision` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `credential_reminder_revision_unique` UNIQUE(`credential_id`,`revision`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `caregiver_credentials` ADD CONSTRAINT `caregiver_credentials_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caregiver_credentials` ADD CONSTRAINT `caregiver_credentials_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credential_events` ADD CONSTRAINT `credential_events_credential_id_caregiver_credentials_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `caregiver_credentials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credential_events` ADD CONSTRAINT `credential_events_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credential_reminders` ADD CONSTRAINT `credential_reminders_credential_id_caregiver_credentials_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `caregiver_credentials`(`id`) ON DELETE no action ON UPDATE no action;