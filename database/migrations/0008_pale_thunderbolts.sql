CREATE TABLE `training_certificates` (
	`id` varchar(36) NOT NULL,
	`enrollment_id` varchar(36) NOT NULL,
	`course_title` varchar(200) NOT NULL,
	`trainee_name` varchar(255) NOT NULL,
	`issuer_name` varchar(255) NOT NULL,
	`issued_by` varchar(36) NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`revoked_at` datetime,
	`revoked_by` varchar(36),
	`revocation_reason` text,
	CONSTRAINT `training_certificates_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `training_courses` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`summary` text NOT NULL,
	`instructor` varchar(200) NOT NULL,
	`duration` varchar(100) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`revision` int NOT NULL DEFAULT 0,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_courses_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `training_enrollments` (
	`id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'enrolled',
	`reflection` text,
	`feedback` text,
	`revision` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_enrollment_unique` UNIQUE(`course_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `training_events` (
	`id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`enrollment_id` varchar(36),
	`actor_id` varchar(36) NOT NULL,
	`action` varchar(30) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_events_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `training_lessons` (
	`id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` longtext NOT NULL,
	`position` int NOT NULL,
	`file_name` varchar(255),
	`stored_name` varchar(50),
	CONSTRAINT `training_lessons_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_lesson_position_unique` UNIQUE(`course_id`,`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `training_progress` (
	`id` varchar(36) NOT NULL,
	`enrollment_id` varchar(36) NOT NULL,
	`lesson_id` varchar(36) NOT NULL,
	`completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_progress_unique` UNIQUE(`enrollment_id`,`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `training_certificates` ADD CONSTRAINT `training_certificates_enrollment_id_training_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `training_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_certificates` ADD CONSTRAINT `training_certificates_issued_by_users_id_fk` FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_certificates` ADD CONSTRAINT `training_certificates_revoked_by_users_id_fk` FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_courses` ADD CONSTRAINT `training_courses_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_enrollments` ADD CONSTRAINT `training_enrollments_course_id_training_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_enrollments` ADD CONSTRAINT `training_enrollments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_events` ADD CONSTRAINT `training_events_course_id_training_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_events` ADD CONSTRAINT `training_events_enrollment_id_training_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `training_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_events` ADD CONSTRAINT `training_events_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_lessons` ADD CONSTRAINT `training_lessons_course_id_training_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_progress` ADD CONSTRAINT `training_progress_enrollment_id_training_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `training_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_progress` ADD CONSTRAINT `training_progress_lesson_id_training_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `training_lessons`(`id`) ON DELETE no action ON UPDATE no action;