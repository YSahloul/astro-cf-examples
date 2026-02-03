CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo_url` text DEFAULT '',
	`sort_order` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '',
	`caption` text DEFAULT '',
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `hours` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`open` text DEFAULT '08:00',
	`close` text DEFAULT '18:00',
	`closed` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hours_day_unique` ON `hours` (`day`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '',
	`phone` text DEFAULT '',
	`vehicle` text DEFAULT '',
	`service` text DEFAULT '',
	`message` text DEFAULT '',
	`status` text DEFAULT 'new',
	`created_at` text DEFAULT '',
	`updated_at` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'Auto Shop' NOT NULL,
	`tagline` text DEFAULT '',
	`description` text DEFAULT '',
	`phone` text DEFAULT '',
	`email` text DEFAULT '',
	`address` text DEFAULT '',
	`city` text DEFAULT '',
	`state` text DEFAULT '',
	`zip` text DEFAULT '',
	`hero_image` text DEFAULT '',
	`instagram` text DEFAULT '',
	`facebook` text DEFAULT '',
	`financing_url` text DEFAULT '',
	`updated_at` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`price` real DEFAULT 0,
	`duration` text DEFAULT '',
	`icon` text DEFAULT 'wrench',
	`featured` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`text` text NOT NULL,
	`rating` integer DEFAULT 5,
	`source` text DEFAULT 'Google',
	`date` text DEFAULT ''
);
