CREATE TABLE `review_events` (
	`id` varchar(36) NOT NULL,
	`reviewer_id` varchar(36) NOT NULL,
	`family_request_id` varchar(36),
	`nanny_application_id` varchar(36),
	`note` text,
	`from_status` varchar(50) NOT NULL,
	`to_status` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `review_events_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `review_events` ADD CONSTRAINT `review_events_reviewer_id_users_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_events` ADD CONSTRAINT `review_events_family_request_id_family_requests_id_fk` FOREIGN KEY (`family_request_id`) REFERENCES `family_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_events` ADD CONSTRAINT `review_events_nanny_application_id_nanny_applications_id_fk` FOREIGN KEY (`nanny_application_id`) REFERENCES `nanny_applications`(`id`) ON DELETE no action ON UPDATE no action;