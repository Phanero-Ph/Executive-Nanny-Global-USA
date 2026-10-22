CREATE TABLE `membership_cycles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`plan` varchar(30) NOT NULL,
	`amount_cents` int NOT NULL,
	`start_date` varchar(10) NOT NULL,
	`end_date` varchar(10) NOT NULL,
	`cancelled_at` datetime,
	`revision` int NOT NULL DEFAULT 0,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `membership_cycles_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `membership_payments` (
	`id` varchar(36) NOT NULL,
	`cycle_id` varchar(36) NOT NULL,
	`amount_cents` int NOT NULL,
	`reference` varchar(100) NOT NULL,
	`method` varchar(30) NOT NULL,
	`paid_date` varchar(10) NOT NULL,
	`recorded_by` varchar(36) NOT NULL,
	`voided_at` datetime,
	`voided_by` varchar(36),
	`void_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `membership_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_payments_reference_unique` UNIQUE(`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `membership_reminders` (
	`cycle_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `membership_reminders_cycle_id` PRIMARY KEY(`cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD CONSTRAINT `membership_cycles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD CONSTRAINT `membership_cycles_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_cycle_id_membership_cycles_id_fk` FOREIGN KEY (`cycle_id`) REFERENCES `membership_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_voided_by_users_id_fk` FOREIGN KEY (`voided_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_reminders` ADD CONSTRAINT `membership_reminders_cycle_id_membership_cycles_id_fk` FOREIGN KEY (`cycle_id`) REFERENCES `membership_cycles`(`id`) ON DELETE no action ON UPDATE no action;