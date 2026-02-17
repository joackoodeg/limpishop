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
  stock: real('stock').notNull().default(0),
  unit: text('unit').notNull().default('unidad'),
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
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
});

// ── Sales ───────────────────────────────────────────────────────────────────
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grandTotal: real('grand_total').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'efectivo' | 'tarjeta' | 'transferencia'
  cashRegisterId: integer('cash_register_id').references(() => cashRegisters.id), // nullable: null when caja module is disabled or no register open
  employeeId: integer('employee_id'),
  employeeName: text('employee_name'),
  date: text('date').default(sql`(datetime('now'))`).notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Sale Items (embedded array → relational table) ──────────────────────────
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  size: real('size'),
  unit: text('unit').default('unidad'),
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
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
});

// ── Store Configuration ─────────────────────────────────────────────────────
export const storeConfig = sqliteTable('store_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeName: text('store_name').notNull().default('Mi Negocio'),
  phone: text('phone').default(''),
  email: text('email').default(''),
  address: text('address').default(''),
  city: text('city').default(''),
  logoUrl: text('logo_url'),
  logoPublicId: text('logo_public_id'),
  taxId: text('tax_id').default(''), // RUC, CUIT, etc.
  // Module toggles (JSON serialized)
  enabledModules: text('enabled_modules').default('{"cajaDiaria":false,"empleados":false}'),
  // Allowed built-in units (JSON array)
  allowedUnits: text('allowed_units').default('["unidad","kilo","litro"]'),
  // Custom units defined by the business (JSON array of objects)
  customUnits: text('custom_units').default('[]'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Stock Movements (historial de stock) ────────────────────────────────────
export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  type: text('type').notNull(), // 'inicial' | 'reposicion' | 'venta' | 'ajuste' | 'devolucion'
  quantity: real('quantity').notNull(), // positivo = entrada, negativo = salida
  previousStock: real('previous_stock').notNull(),
  newStock: real('new_stock').notNull(),
  note: text('note').default(''),
  referenceId: integer('reference_id'), // nullable, vincula a sales.id cuando type='venta'|'devolucion'
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Cash Register (Caja Diaria) ─────────────────────────────────────────────
export const cashRegisters = sqliteTable('cash_registers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  openedAt: text('opened_at').default(sql`(datetime('now'))`).notNull(),
  closedAt: text('closed_at'),
  openingAmount: real('opening_amount').notNull().default(0),
  closingAmount: real('closing_amount'),
  expectedAmount: real('expected_amount'),
  difference: real('difference'),
  status: text('status').notNull().default('open'), // 'open' | 'closed'
  note: text('note').default(''),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

export const cashMovements = sqliteTable('cash_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cashRegisterId: integer('cash_register_id').notNull().references(() => cashRegisters.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'ingreso' | 'egreso' | 'venta'
  amount: real('amount').notNull(),
  description: text('description').default(''),
  category: text('category').notNull().default('otro'), // 'venta' | 'pago_proveedor' | 'retiro' | 'deposito' | 'otro'
  referenceId: integer('reference_id'), // nullable, links to sales.id when type='venta'
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

// ── Employees (Empleados) ───────────────────────────────────────────────────
export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // hashed password
  role: text('role').notNull().default('vendedor'), // 'vendedor' | 'admin' | 'cajero'
  phone: text('phone').default(''),
  email: text('email').default(''),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});
