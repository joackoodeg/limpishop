import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Categories ──────────────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description').default(''),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Products ────────────────────────────────────────────────────────────────
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cost: real('cost').default(0),
  stock: integer('stock').notNull().default(0),
  description: text('description').default(''),
  categoryId: integer('category_id').references(() => categories.id),
  categoryName: text('category_name'),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  active: integer('active', { mode: 'boolean' }).default(false),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Product Prices (embedded array → relational table) ──────────────────────
export const productPrices = sqliteTable('product_prices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});

// ── Sales ───────────────────────────────────────────────────────────────────
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grandTotal: real('grand_total').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'efectivo' | 'tarjeta' | 'transferencia'
  date: text('date').default(sql`(datetime('now'))`).notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Sale Items (embedded array → relational table) ──────────────────────────
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: integer('product_id'),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  size: real('size'),
  total: real('total'),
});

// ── Combos ──────────────────────────────────────────────────────────────────
export const combos = sqliteTable('combos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').default(''),
  originalPrice: real('original_price').notNull(),
  discountPercentage: real('discount_percentage').notNull(),
  finalPrice: real('final_price').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Combo Products (embedded array → relational table) ──────────────────────
export const comboProducts = sqliteTable('combo_products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  comboId: integer('combo_id').notNull().references(() => combos.id, { onDelete: 'cascade' }),
  productId: integer('product_id'),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});
