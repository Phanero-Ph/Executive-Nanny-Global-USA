CREATE TABLE `stripe_billing` (
	`user_id` varchar(36) NOT NULL,
	`customer_id` varchar(255) NOT NULL,
	`subscription_id` varchar(255),
	`status` varchar(40) NOT NULL DEFAULT 'none',
	`plan` varchar(30),
	`period_end` datetime,
	`cancel_at_period_end` int NOT NULL DEFAULT 0,
	`checkout_key` varchar(36),
	`checkout_plan` varchar(30),
	`checkout_session_id` varchar(255),
	`updated_at` datetime NOT NULL,
	CONSTRAINT `stripe_billing_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `stripe_billing_customer_id_unique` UNIQUE(`customer_id`),
	CONSTRAINT `stripe_billing_subscription_id_unique` UNIQUE(`subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_events_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD `source` varchar(20) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD `stripe_invoice_id` varchar(255);--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD `period_start` datetime;--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD `period_end` datetime;--> statement-breakpoint
ALTER TABLE `membership_cycles` ADD CONSTRAINT `membership_cycles_stripe_invoice_id_unique` UNIQUE(`stripe_invoice_id`);--> statement-breakpoint
ALTER TABLE `stripe_billing` ADD CONSTRAINT `stripe_billing_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;