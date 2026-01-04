CREATE TABLE `customer_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`vehicle_id` int,
	`sender_type` enum('customer','staff') NOT NULL,
	`sender_name` varchar(255),
	`message` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_portal_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`access_token` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`is_active` boolean NOT NULL DEFAULT true,
	`last_access_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(255),
	CONSTRAINT `customer_portal_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_portal_access_access_token_unique` UNIQUE(`access_token`)
);
--> statement-breakpoint
CREATE TABLE `customer_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`tag_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zip_code` varchar(20),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`original_lead_id` int,
	`agent_id` int,
	`agent_name` varchar(255),
	`preferred_contact` enum('phone','email','text') DEFAULT 'phone',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimate_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estimate_id` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price` int NOT NULL,
	`total` int NOT NULL,
	`category` enum('labor','parts','materials','other') DEFAULT 'other',
	CONSTRAINT `estimate_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`estimate_number` varchar(50) NOT NULL,
	`status` enum('draft','sent','approved','rejected') DEFAULT 'draft',
	`subtotal` int NOT NULL,
	`tax_rate` int DEFAULT 0,
	`tax_amount` int DEFAULT 0,
	`discount_amount` int DEFAULT 0,
	`total` int NOT NULL,
	`notes` text,
	`valid_until` timestamp,
	`created_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`),
	CONSTRAINT `estimates_estimate_number_unique` UNIQUE(`estimate_number`)
);
--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int,
	`customer_id` int,
	`vehicle_id` int,
	`agent_id` int NOT NULL,
	`agent_name` varchar(255) NOT NULL,
	`stage` enum('lead','scheduled','in_shop','awaiting_pickup','complete','referral') NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_ups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspection_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspection_id` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`item` varchar(255) NOT NULL,
	`condition` enum('good','fair','poor','damaged','missing'),
	`notes` text,
	`photo_url` text,
	CONSTRAINT `inspection_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`customer_id` int,
	`inspector_id` int,
	`inspector_name` varchar(255),
	`status` enum('pending','in_progress','completed') DEFAULT 'pending',
	`exterior_condition` text,
	`interior_condition` text,
	`mechanical_notes` text,
	`damage_assessment` text,
	`overall_condition` enum('excellent','good','fair','poor'),
	`estimated_repair_cost` int,
	`recommendations` text,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`invoice_id` int,
	`amount` int NOT NULL,
	`check_number` varchar(100),
	`payment_date` timestamp,
	`received_date` timestamp,
	`deposited_date` timestamp,
	`status` enum('pending','received','deposited','cleared') DEFAULT 'pending',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurance_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_id` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price` int NOT NULL,
	`total` int NOT NULL,
	`category` enum('labor','parts','materials','other') DEFAULT 'other',
	CONSTRAINT `invoice_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`estimate_id` int,
	`invoice_number` varchar(50) NOT NULL,
	`status` enum('draft','sent','paid','partial','overdue','cancelled') DEFAULT 'draft',
	`subtotal` int NOT NULL,
	`tax_rate` int DEFAULT 0,
	`tax_amount` int DEFAULT 0,
	`discount_amount` int DEFAULT 0,
	`total` int NOT NULL,
	`amount_paid` int DEFAULT 0,
	`amount_due` int NOT NULL,
	`due_date` timestamp,
	`paid_date` timestamp,
	`payment_method` varchar(100),
	`payment_reference` varchar(255),
	`notes` text,
	`created_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `job_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`technician_id` int NOT NULL,
	`assigned_by` varchar(255),
	`status` enum('assigned','in_progress','completed','cancelled') DEFAULT 'assigned',
	`priority` enum('low','normal','high','urgent') DEFAULT 'normal',
	`estimated_hours` int,
	`actual_hours` int,
	`started_at` timestamp,
	`completed_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int NOT NULL,
	`tag_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`phone` varchar(50),
	`email` varchar(320),
	`address` text NOT NULL,
	`city` varchar(100),
	`state` varchar(50),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`status` enum('new','contacted','interested','not_interested','converted') NOT NULL DEFAULT 'new',
	`last_follow_up_at` timestamp,
	`follow_up_result` enum('no_answer','not_interested','interested','scheduled'),
	`next_follow_up_date` timestamp,
	`agent_id` int,
	`agent_name` varchar(255),
	`source` varchar(100),
	`source_details` text,
	`referral_code` varchar(50),
	`referred_by` int,
	`notes` text,
	`converted_to_customer_id` int,
	`converted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loaner_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loaner_vehicle_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`vehicle_id` int,
	`assigned_by` varchar(255),
	`status` enum('active','returned') DEFAULT 'active',
	`mileage_out` int,
	`mileage_in` int,
	`fuel_level_out` varchar(20),
	`fuel_level_in` varchar(20),
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	`returned_at` timestamp,
	`condition_notes` text,
	CONSTRAINT `loaner_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loaner_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` varchar(4),
	`make` varchar(100),
	`model` varchar(100),
	`color` varchar(50),
	`vin` varchar(17),
	`license_plate` varchar(20),
	`status` enum('available','assigned','maintenance','out_of_service') DEFAULT 'available',
	`current_mileage` int,
	`last_service_date` timestamp,
	`next_service_due` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loaner_vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int,
	`customer_id` int,
	`vehicle_id` int,
	`reminder_type` enum('appointment','payment_due','inspection_followup','pickup_ready','custom') NOT NULL,
	`scheduled_for` timestamp NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`method` enum('sms','email','both') NOT NULL DEFAULT 'sms',
	`created_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_id` int NOT NULL,
	`permission_id` int NOT NULL,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) DEFAULT '#3B82F6',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `technicians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`specialty` varchar(255),
	`status` enum('active','inactive','on_leave') DEFAULT 'active',
	`hire_date` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `text_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stage` enum('lead','scheduled','in_shop','awaiting_pickup','complete','referral') NOT NULL,
	`template` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `text_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `text_templates_stage_unique` UNIQUE(`stage`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`permission_id` int NOT NULL,
	`granted_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`role_id` int NOT NULL,
	`assigned_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`document_url` text NOT NULL,
	`filename` varchar(255) NOT NULL,
	`file_type` varchar(50) NOT NULL,
	`file_size` int,
	`category` enum('insurance','estimate','invoice','receipt','authorization','other'),
	`description` text,
	`uploaded_by` varchar(255),
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_insurance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`provider` varchar(255),
	`provider_phone` varchar(50),
	`claim_number` varchar(100),
	`policy_number` varchar(100),
	`deductible` int,
	`adjuster_name` varchar(255),
	`adjuster_phone` varchar(50),
	`adjuster_email` varchar(320),
	`adjuster_office_hours` varchar(255),
	`rental_company` varchar(255),
	`rental_confirmation` varchar(100),
	`rental_start_date` timestamp,
	`rental_end_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_insurance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicle_id` int NOT NULL,
	`photo_url` text NOT NULL,
	`thumbnail_url` text,
	`caption` varchar(255),
	`photo_type` enum('before','during','after','damage','other') DEFAULT 'other',
	`uploaded_by` varchar(255),
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int,
	`lead_id` int,
	`year` varchar(4),
	`make` varchar(100),
	`model` varchar(100),
	`color` varchar(50),
	`vin` varchar(17),
	`license_plate` varchar(20),
	`glass_damage` enum('yes','no'),
	`damage_description` text,
	`status` enum('lead','scheduled','in_shop','awaiting_pickup','complete') NOT NULL DEFAULT 'lead',
	`sub_status` varchar(100),
	`claim_filed` boolean DEFAULT false,
	`claim_filed_date` timestamp,
	`appointment_date` timestamp,
	`shop_drop_off_date` timestamp,
	`estimated_completion_date` timestamp,
	`actual_completion_date` timestamp,
	`pickup_date` timestamp,
	`assigned_technician_id` int,
	`assigned_technician_name` varchar(255),
	`loaner_vehicle_id` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
