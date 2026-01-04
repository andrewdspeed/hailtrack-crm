CREATE TABLE `lead_calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int NOT NULL,
	`vehicle_id` int,
	`event_id` varchar(255) NOT NULL,
	`event_type` enum('appointment','follow_up','pickup','other') DEFAULT 'appointment',
	`title` varchar(255),
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_calendar_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_calendar_tokens_id` PRIMARY KEY(`id`)
);
