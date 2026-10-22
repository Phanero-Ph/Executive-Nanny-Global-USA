CREATE TABLE `contact_messages` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(254) NOT NULL,
	`phone` varchar(50),
	`subject` text,
	`message` text NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `family_requests` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`email` varchar(254) NOT NULL,
	`phone` varchar(50),
	`zip` varchar(20),
	`town` varchar(255),
	`service_type` varchar(255) NOT NULL,
	`children_info` text,
	`schedule` text,
	`start_date` varchar(30),
	`budget` varchar(255),
	`message` text,
	`status` varchar(50) NOT NULL DEFAULT 'lead',
	`search_fee_status` varchar(30) NOT NULL DEFAULT 'unpaid',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `family_requests_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `nanny_applications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`email` varchar(254) NOT NULL,
	`phone` varchar(50),
	`city` text,
	`experience_years` int,
	`certifications` text,
	`availability` text,
	`services` text,
	`bio` longtext,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`subscription_status` varchar(30) NOT NULL DEFAULT 'inactive',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `nanny_applications_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` varchar(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'family',
	`name` varchar(255) NOT NULL,
	`email` varchar(254) NOT NULL,
	`phone` varchar(50),
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `family_requests` ADD CONSTRAINT `family_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nanny_applications` ADD CONSTRAINT `nanny_applications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;