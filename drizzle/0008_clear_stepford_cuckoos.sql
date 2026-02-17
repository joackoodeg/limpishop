ALTER TABLE `employees` ADD `username` text NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `password` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `employees_username_unique` ON `employees` (`username`);