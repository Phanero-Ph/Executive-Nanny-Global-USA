CREATE TABLE `booking_assignments` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`caregiver_id` varchar(36) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'invited',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`responded_at` datetime,
	CONSTRAINT `booking_assignments_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `booking_events` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`actor_id` varchar(36) NOT NULL,
	`action` varchar(30) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `booking_events_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `care_bookings` (
	`id` varchar(36) NOT NULL,
	`family_id` varchar(36) NOT NULL,
	`cycle_id` varchar(36) NOT NULL,
	`request_key` varchar(36) NOT NULL,
	`starts_at` datetime NOT NULL,
	`ends_at` datetime NOT NULL,
	`town` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`care_needs` text NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'requested',
	`caregiver_id` varchar(36),
	`application_id` varchar(36),
	`consumes_credit` int NOT NULL DEFAULT 1,
	`revision` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `care_bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_family_request_unique` UNIQUE(`family_id`,`request_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `booking_assignments` ADD CONSTRAINT `booking_assignments_booking_id_care_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `care_bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_assignments` ADD CONSTRAINT `booking_assignments_caregiver_id_users_id_fk` FOREIGN KEY (`caregiver_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_events` ADD CONSTRAINT `booking_events_booking_id_care_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `care_bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_events` ADD CONSTRAINT `booking_events_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `care_bookings` ADD CONSTRAINT `care_bookings_family_id_users_id_fk` FOREIGN KEY (`family_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `care_bookings` ADD CONSTRAINT `care_bookings_cycle_id_membership_cycles_id_fk` FOREIGN KEY (`cycle_id`) REFERENCES `membership_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `care_bookings` ADD CONSTRAINT `care_bookings_caregiver_id_users_id_fk` FOREIGN KEY (`caregiver_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `care_bookings` ADD CONSTRAINT `care_bookings_application_id_nanny_applications_id_fk` FOREIGN KEY (`application_id`) REFERENCES `nanny_applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `booking_assignment_caregiver` ON `booking_assignments` (`caregiver_id`);--> statement-breakpoint
CREATE INDEX `booking_family_dates` ON `care_bookings` (`family_id`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `booking_caregiver_dates` ON `care_bookings` (`caregiver_id`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `booking_cycle_credit` ON `care_bookings` (`cycle_id`,`consumes_credit`);