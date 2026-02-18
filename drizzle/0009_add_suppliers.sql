-- Suppliers table
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL UNIQUE,
  `contact_name` text DEFAULT '',
  `phone` text DEFAULT '',
  `email` text DEFAULT '',
  `address` text DEFAULT '',
  `city` text DEFAULT '',
  `tax_id` text DEFAULT '',
  `notes` text DEFAULT '',
  `active` integer DEFAULT true,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
-- Supplier Products (bridge table)
CREATE TABLE IF NOT EXISTS `supplier_products` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `supplier_id` integer NOT NULL REFERENCES `suppliers`(`id`) ON DELETE CASCADE,
  `product_id` integer NOT NULL REFERENCES `products`(`id`) ON DELETE CASCADE,
  `product_name` text NOT NULL,
  `cost` real,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
-- Supplier Payments
CREATE TABLE IF NOT EXISTS `supplier_payments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `supplier_id` integer NOT NULL REFERENCES `suppliers`(`id`) ON DELETE CASCADE,
  `amount` real NOT NULL,
  `payment_method` text NOT NULL,
  `date` text DEFAULT (datetime('now')) NOT NULL,
  `note` text DEFAULT '',
  `cash_register_id` integer REFERENCES `cash_registers`(`id`),
  `cash_movement_id` integer,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
-- Add supplier_id and supplier_cost to stock_movements for tracking supplier debt
ALTER TABLE `stock_movements` ADD COLUMN `supplier_id` integer;
--> statement-breakpoint
ALTER TABLE `stock_movements` ADD COLUMN `supplier_cost` real;
