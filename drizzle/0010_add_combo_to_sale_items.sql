ALTER TABLE `sale_items` ADD COLUMN `combo_id` INTEGER REFERENCES combos(id);
--> statement-breakpoint
ALTER TABLE `sale_items` ADD COLUMN `combo_name` TEXT;
