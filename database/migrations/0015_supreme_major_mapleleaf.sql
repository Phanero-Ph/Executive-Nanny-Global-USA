CREATE TABLE `conversation_attachments` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`uploader_id` varchar(36) NOT NULL,
	`message_id` varchar(36),
	`upload_key` varchar(36) NOT NULL,
	`content_hash` varchar(64) NOT NULL,
	`file_name` varchar(180) NOT NULL,
	`stored_name` varchar(80) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`size_bytes` int NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `conversation_attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_upload_retry_unique` UNIQUE(`conversation_id`,`uploader_id`,`upload_key`)
);
--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD `reply_to_id` varchar(36);--> statement-breakpoint
ALTER TABLE `conversation_attachments` ADD CONSTRAINT `conversation_attachments_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_attachments` ADD CONSTRAINT `conversation_attachments_uploader_id_users_id_fk` FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_attachments` ADD CONSTRAINT `conversation_attachments_message_id_conversation_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `conversation_messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chat_attachment_message` ON `conversation_attachments` (`message_id`);--> statement-breakpoint
CREATE INDEX `chat_upload_expiry` ON `conversation_attachments` (`message_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `chat_upload_owner` ON `conversation_attachments` (`uploader_id`,`created_at`);