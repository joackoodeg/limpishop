ALTER TABLE `products` ADD COLUMN `unit` text DEFAULT 'unidad' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sale_items` ADD COLUMN `unit` text DEFAULT 'unidad';
