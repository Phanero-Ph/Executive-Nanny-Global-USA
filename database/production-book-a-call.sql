-- Book a Call scheduling: run once against the production MySQL database.
-- Uses only the two tables required by the feature. Availability defaults to
-- weekdays, 9:00 AM–5:00 PM Eastern Time, with 30-minute calls.

CREATE TABLE IF NOT EXISTS `call_booking_settings` (
  `id` int NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'America/New_York',
  `duration_minutes` int NOT NULL DEFAULT 30,
  `buffer_minutes` int NOT NULL DEFAULT 0,
  `lead_hours` int NOT NULL DEFAULT 1,
  `max_days_ahead` int NOT NULL DEFAULT 60,
  `weekly_hours` longtext NOT NULL,
  `blocked_dates` longtext NOT NULL,
  `revision` int NOT NULL DEFAULT 0,
  `updated_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `call_booking_settings_updated_by_fk` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `call_booking_settings`
  (`id`,`timezone`,`duration_minutes`,`buffer_minutes`,`lead_hours`,`max_days_ahead`,`weekly_hours`,`blocked_dates`)
VALUES
  (1,'America/New_York',30,0,1,60,
   '{"0":null,"1":{"start":"09:00","end":"17:00"},"2":{"start":"09:00","end":"17:00"},"3":{"start":"09:00","end":"17:00"},"4":{"start":"09:00","end":"17:00"},"5":{"start":"09:00","end":"17:00"},"6":null}',
   '[]')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Reduce the initial 24-hour default for existing installations, while
-- preserving any minimum-notice value an admin has since customized.
UPDATE `call_booking_settings`
SET `lead_hours` = 1, `revision` = `revision` + 1, `updated_at` = CURRENT_TIMESTAMP
WHERE `id` = 1 AND `lead_hours` = 24;

CREATE TABLE IF NOT EXISTS `call_bookings` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'America/New_York',
  `message` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `meeting_details` text DEFAULT NULL,
  `admin_reply` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `call_booking_status_start_idx` (`status`,`starts_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
