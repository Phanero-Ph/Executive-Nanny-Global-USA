CREATE TABLE `conversation_messages` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`request_key` varchar(36) NOT NULL,
	`sequence` int NOT NULL,
	`body` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_message_sequence_unique` UNIQUE(`conversation_id`,`sequence`),
	CONSTRAINT `conversation_message_request_unique` UNIQUE(`conversation_id`,`sender_id`,`request_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `conversation_reads` (
	`conversation_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`last_sequence` int NOT NULL DEFAULT 0,
	CONSTRAINT `conversation_read_user_unique` UNIQUE(`conversation_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(36) NOT NULL,
	`kind` varchar(10) NOT NULL,
	`source_id` varchar(36) NOT NULL,
	`family_id` varchar(36) NOT NULL,
	`nanny_id` varchar(36) NOT NULL,
	`last_sequence` int NOT NULL DEFAULT 0,
	`updated_at` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_context_caregiver_unique` UNIQUE(`kind`,`source_id`,`nanny_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD CONSTRAINT `conversation_messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD CONSTRAINT `conversation_messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_reads` ADD CONSTRAINT `conversation_reads_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_reads` ADD CONSTRAINT `conversation_reads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_family_id_users_id_fk` FOREIGN KEY (`family_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_nanny_id_users_id_fk` FOREIGN KEY (`nanny_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `conversation_family_updated` ON `conversations` (`family_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `conversation_nanny_updated` ON `conversations` (`nanny_id`,`updated_at`);