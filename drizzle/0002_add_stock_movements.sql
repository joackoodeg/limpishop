CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL REFERENCES `products`(`id`) ON DELETE CASCADE,
	`product_name` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`previous_stock` real NOT NULL,
	`new_stock` real NOT NULL,
	`note` text DEFAULT '',
	`reference_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
