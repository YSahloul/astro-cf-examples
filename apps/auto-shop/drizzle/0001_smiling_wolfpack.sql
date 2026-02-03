CREATE TABLE `conversation_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tool_name` text DEFAULT '',
	`tool_input` text DEFAULT '',
	`tool_output` text DEFAULT '',
	`created_at` text DEFAULT '',
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`lead_id` integer,
	`vehicle_year` integer,
	`vehicle_make` text DEFAULT '',
	`vehicle_model` text DEFAULT '',
	`intent` text DEFAULT '',
	`message_count` integer DEFAULT 0,
	`first_message_at` text DEFAULT '',
	`last_message_at` text DEFAULT '',
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT '',
	`updated_at` text DEFAULT '',
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_session_id_unique` ON `conversations` (`session_id`);--> statement-breakpoint
CREATE TABLE `leads_ai` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer,
	`vehicle_year` integer,
	`vehicle_make` text DEFAULT '',
	`vehicle_model` text DEFAULT '',
	`vehicle_trim` text DEFAULT '',
	`intent` text DEFAULT '',
	`recommended_builds` text DEFAULT '',
	`selected_build` text DEFAULT '',
	`quote_id` text DEFAULT '',
	`agent_session_id` text DEFAULT '',
	`source` text DEFAULT 'ai_assistant',
	`created_at` text DEFAULT '',
	`updated_at` text DEFAULT '',
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` text NOT NULL,
	`lead_id` integer,
	`conversation_id` integer,
	`vehicle_year` integer,
	`vehicle_make` text DEFAULT '',
	`vehicle_model` text DEFAULT '',
	`intent` text DEFAULT '',
	`wheel_specs` text DEFAULT '',
	`tire_specs` text DEFAULT '',
	`suspension_specs` text DEFAULT '',
	`total_price` real DEFAULT 0,
	`evidence_builds` text DEFAULT '',
	`qr_code_url` text DEFAULT '',
	`status` text DEFAULT 'draft',
	`expires_at` text DEFAULT '',
	`created_at` text DEFAULT '',
	`updated_at` text DEFAULT '',
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_quote_id_unique` ON `quotes` (`quote_id`);