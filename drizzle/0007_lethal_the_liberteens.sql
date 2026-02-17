PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_combo_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`combo_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`combo_id`) REFERENCES `combos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_combo_products`("id", "combo_id", "product_id", "product_name", "quantity", "price") SELECT "id", "combo_id", "product_id", "product_name", "quantity", "price" FROM `combo_products`;--> statement-breakpoint
DROP TABLE `combo_products`;--> statement-breakpoint
ALTER TABLE `__new_combo_products` RENAME TO `combo_products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`size` real,
	`unit` text DEFAULT 'unidad',
	`total` real,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "product_name", "quantity", "price", "size", "unit", "total") SELECT "id", "sale_id", "product_id", "product_name", "quantity", "price", "size", "unit", "total" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint
ALTER TABLE `sales` ADD `cash_register_id` integer REFERENCES cash_registers(id);