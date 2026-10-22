ALTER TABLE `conversations` MODIFY COLUMN `family_id` varchar(36);--> statement-breakpoint
ALTER TABLE `conversations` MODIFY COLUMN `nanny_id` varchar(36);--> statement-breakpoint
ALTER TABLE `conversations` ADD `member_id` varchar(36);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversation_member_unique` UNIQUE(`member_id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_member_id_users_id_fk` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;