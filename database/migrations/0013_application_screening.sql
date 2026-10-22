CREATE TABLE `application_screenings` (
 `application_id` varchar(36) NOT NULL PRIMARY KEY,
 `application_digest` varchar(64) NOT NULL,
 `checks` text NOT NULL,
 `reference_reviews` text NOT NULL,
 `feedback` text,
 `revision` int NOT NULL DEFAULT 0,
 `reviewed_by` varchar(36) NOT NULL,
 `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT `screening_application_fk` FOREIGN KEY (`application_id`) REFERENCES `nanny_applications` (`id`) ON DELETE CASCADE,
 CONSTRAINT `screening_reviewer_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
);
