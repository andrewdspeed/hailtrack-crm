CREATE TABLE `active_routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`agent_name` varchar(255) NOT NULL,
	`route_name` varchar(255) NOT NULL,
	`route_type` varchar(100),
	`priority` int DEFAULT 5,
	`total_stops` int NOT NULL,
	`completed_stops` int DEFAULT 0,
	`total_distance` decimal(10,2),
	`estimated_time` int,
	`current_latitude` varchar(50),
	`current_longitude` varchar(50),
	`last_location_update` timestamp,
	`status` enum('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
	`territory_id` int,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `active_routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`agent_name` varchar(255) NOT NULL,
	`latitude` varchar(50) NOT NULL,
	`longitude` varchar(50) NOT NULL,
	`accuracy` decimal(10,2),
	`is_active` boolean DEFAULT true,
	`active_route_id` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `agent_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`agent_name` varchar(255) NOT NULL,
	`route_name` varchar(255) NOT NULL,
	`route_type` varchar(100),
	`priority` int,
	`total_stops` int NOT NULL,
	`completed_stops` int NOT NULL,
	`skipped_stops` int DEFAULT 0,
	`planned_distance` decimal(10,2),
	`actual_distance` decimal(10,2),
	`estimated_time` int,
	`actual_time` int,
	`conversions` int DEFAULT 0,
	`follow_ups` int DEFAULT 0,
	`not_interested` int DEFAULT 0,
	`no_answers` int DEFAULT 0,
	`conversion_rate` decimal(5,2),
	`territory_id` int,
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp NOT NULL,
	`duration` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `route_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_stops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`route_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`stop_order` int NOT NULL,
	`latitude` varchar(50) NOT NULL,
	`longitude` varchar(50) NOT NULL,
	`address` text NOT NULL,
	`status` enum('pending','in_progress','completed','skipped') NOT NULL DEFAULT 'pending',
	`estimated_arrival` timestamp,
	`actual_arrival` timestamp,
	`departure_time` timestamp,
	`time_spent` int,
	`outcome` enum('converted','follow_up','not_interested','no_answer'),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `route_stops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `territories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7),
	`boundary_coordinates` text NOT NULL,
	`assigned_agent_id` int,
	`assigned_agent_name` varchar(255),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `territories_id` PRIMARY KEY(`id`)
);
