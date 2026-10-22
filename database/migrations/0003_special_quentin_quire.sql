CREATE TABLE `nanny_matches` (
	`id` varchar(36) NOT NULL,
	`family_request_id` varchar(36) NOT NULL,
	`nanny_application_id` varchar(36) NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'shortlisted',
	`interview_at` datetime,
	`placement_start` varchar(10),
	`shared_note` text,
	`revision` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `nanny_matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `match_request_application_unique` UNIQUE(`family_request_id`,`nanny_application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `nanny_matches` ADD CONSTRAINT `nanny_matches_family_request_id_family_requests_id_fk` FOREIGN KEY (`family_request_id`) REFERENCES `family_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nanny_matches` ADD CONSTRAINT `nanny_matches_nanny_application_id_nanny_applications_id_fk` FOREIGN KEY (`nanny_application_id`) REFERENCES `nanny_applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nanny_matches` ADD CONSTRAINT `nanny_matches_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;