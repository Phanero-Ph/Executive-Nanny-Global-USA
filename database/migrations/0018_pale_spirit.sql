CREATE TABLE `admin_access` (
	`user_id` varchar(36) NOT NULL,
	`super_admin` int NOT NULL DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT 'invited',
	`role_label` varchar(80) NOT NULL DEFAULT 'Custom',
	`permissions` text NOT NULL,
	`revision` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_access_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `admin_access_lock` (
	`id` int NOT NULL,
	CONSTRAINT `admin_access_lock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_invitations` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`consumed_at` datetime,
	`revoked_at` datetime,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_invitations_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `admin_access` ADD CONSTRAINT `admin_access_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_invitations` ADD CONSTRAINT `admin_invitations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_invitations` ADD CONSTRAINT `admin_invitations_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO `admin_access` (`user_id`,`super_admin`,`status`,`role_label`,`permissions`)
SELECT `id`,1,'active','Super Admin','[]' FROM `users` WHERE `role`='admin';
--> statement-breakpoint
INSERT INTO `admin_access_lock` (`id`) VALUES (1);
