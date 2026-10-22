CREATE TABLE `account_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`purpose` varchar(20) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `account_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_tokens_token_hash_unique` UNIQUE(`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `mail_jobs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`recipient` varchar(254) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` longtext NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`attempted_at` datetime,
	`sent_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mail_jobs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `recovery_limits` (
	`limiter_key` varchar(64) NOT NULL,
	`request_count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `recovery_limits_limiter_key` PRIMARY KEY(`limiter_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `users` ADD `session_version` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` datetime;--> statement-breakpoint
ALTER TABLE `account_tokens` ADD CONSTRAINT `account_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mail_jobs` ADD CONSTRAINT `mail_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;