CREATE TABLE `day_meta` (
	`date` text PRIMARY KEY NOT NULL,
	`water_ml` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `diary_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`meal` text NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`amount` real NOT NULL,
	`kcal` real NOT NULL,
	`protein` real NOT NULL,
	`fat` real NOT NULL,
	`carbs` real NOT NULL,
	`source` text,
	`recipe_id` text,
	`created_at` text NOT NULL,
	CONSTRAINT "diary_meal_check" CHECK("diary_entries"."meal" in ('dorucak','rucak','vecera','uzina')),
	CONSTRAINT "diary_amount_check" CHECK("diary_entries"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_diary_date` ON `diary_entries` (`date`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`barcode` text,
	`unit` text NOT NULL,
	`base_amount` real NOT NULL,
	`kcal` real NOT NULL,
	`protein` real NOT NULL,
	`fat` real NOT NULL,
	`carbs` real NOT NULL,
	`source` text,
	`verified` integer DEFAULT 0 NOT NULL,
	`use_count` integer DEFAULT 1 NOT NULL,
	`last_used` text,
	`created_at` text NOT NULL,
	CONSTRAINT "foods_unit_check" CHECK("foods"."unit" in ('g','kom')),
	CONSTRAINT "foods_base_amount_check" CHECK("foods"."base_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE `recipe_items` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`amount` real NOT NULL,
	`kcal` real NOT NULL,
	`protein` real NOT NULL,
	`fat` real NOT NULL,
	`carbs` real NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`portions` real DEFAULT 1 NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`last_used` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplement_log` (
	`date` text NOT NULL,
	`supplement_id` text NOT NULL,
	`taken_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`date`, `supplement_id`)
);
--> statement-breakpoint
CREATE TABLE `supplements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`detail` text,
	`doses` integer DEFAULT 1 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`reminder_time` text,
	CONSTRAINT "supplements_doses_check" CHECK("supplements"."doses" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE `weight_log` (
	`date` text PRIMARY KEY NOT NULL,
	`kg` real NOT NULL
);
