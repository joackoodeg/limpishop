import { db } from '@/lib/db';
import { suppliers, supplierProducts, supplierPayments, stockMovements, storeConfig } from '@/lib/db/schema';
import { asc, desc, eq, sum, and } from 'drizzle-orm';
import type { EnabledModules } from '@/lib/types/config';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  taxId: string;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProduct {
  id: number;
  supplierId: number;
  productId: number;
  productName: string;
  cost: number | null;
  createdAt: string;
}

export interface SupplierPayment {
  id: number;
  supplierId: number;
  amount: number;
  paymentMethod: string;
  date: string;
  note: string;
  cashRegisterId: number | null;
  cashMovementId: number | null;
  createdAt: string;
}

export interface SupplierBalance {
  totalDebt: number;
  totalPaid: number;
  balance: number; // positive = owe supplier, negative = supplier owes us
}

// ── Module check ────────────────────────────────────────────────────────────

/**
 * Check if Proveedores module is enabled (server-side)
 */
export async function isProveedoresEnabled(): Promise<boolean> {
  try {
    const [config] = await db.select().from(storeConfig).limit(1);
    if (!config?.enabledModules) return false;
    const modules = JSON.parse(config.enabledModules) as EnabledModules;
    return modules.proveedores === true;
  } catch {
    return false;
  }
}

// ── Suppliers CRUD ──────────────────────────────────────────────────────────

/**
 * Fetch all suppliers ordered by name
 */
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const rows = await db
      .select()
      .from(suppliers)
      .orderBy(asc(suppliers.name));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      contactName: r.contactName ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      address: r.address ?? '',
      city: r.city ?? '',
      taxId: r.taxId ?? '',
      notes: r.notes ?? '',
      active: r.active ?? true,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

/**
 * Fetch only active suppliers
 */
export async function getActiveSuppliers(): Promise<Pick<Supplier, 'id' | 'name'>[]> {
  try {
    const rows = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.active, true))
      .orderBy(asc(suppliers.name));
    return rows;
  } catch (error) {
    console.error('Error fetching active suppliers:', error);
    return [];
  }
}

/**
 * Fetch a single supplier by ID
 */
export async function getSupplierById(id: number): Promise<Supplier | null> {
  try {
    const [row] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      contactName: row.contactName ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      taxId: row.taxId ?? '',
      notes: row.notes ?? '',
      active: row.active ?? true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return null;
  }
}

// ── Supplier Products ───────────────────────────────────────────────────────

/**
 * Fetch products associated with a supplier
 */
export async function getSupplierProducts(supplierId: number): Promise<SupplierProduct[]> {
  try {
    const rows = await db
      .select()
      .from(supplierProducts)
      .where(eq(supplierProducts.supplierId, supplierId))
      .orderBy(asc(supplierProducts.productName));

    return rows.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      productId: r.productId,
      productName: r.productName,
      cost: r.cost,
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    return [];
  }
}

// ── Supplier Payments ───────────────────────────────────────────────────────

/**
 * Fetch payments made to a supplier
 */
export async function getSupplierPayments(supplierId: number): Promise<SupplierPayment[]> {
  try {
    const rows = await db
      .select()
      .from(supplierPayments)
      .where(eq(supplierPayments.supplierId, supplierId))
      .orderBy(desc(supplierPayments.date));

    return rows.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      amount: r.amount,
      paymentMethod: r.paymentMethod,
      date: r.date,
      note: r.note ?? '',
      cashRegisterId: r.cashRegisterId,
      cashMovementId: r.cashMovementId,
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    return [];
  }
}

// ── Balance ─────────────────────────────────────────────────────────────────

/**
 * Calculate the balance for a supplier.
 * Debt = sum of supplierCost from stock_movements linked to this supplier.
 * Paid = sum of amount from supplier_payments for this supplier.
 * Balance = Debt - Paid (positive means we owe the supplier).
 */
export async function getSupplierBalance(supplierId: number): Promise<SupplierBalance> {
  try {
    // Total debt: sum of supplierCost from stock reposiciones linked to this supplier
    const [debtRow] = await db
      .select({ total: sum(stockMovements.supplierCost) })
      .from(stockMovements)
      .where(eq(stockMovements.supplierId, supplierId));

    // Total paid: sum of payments to this supplier
    const [paidRow] = await db
      .select({ total: sum(supplierPayments.amount) })
      .from(supplierPayments)
      .where(eq(supplierPayments.supplierId, supplierId));

    const totalDebt = Number(debtRow?.total ?? 0);
    const totalPaid = Number(paidRow?.total ?? 0);

    return {
      totalDebt,
      totalPaid,
      balance: totalDebt - totalPaid,
    };
  } catch (error) {
    console.error('Error calculating supplier balance:', error);
    return { totalDebt: 0, totalPaid: 0, balance: 0 };
  }
}

/**
 * Fetch all suppliers with their balances (for list view)
 */
export async function getSuppliersWithBalance(): Promise<(Supplier & { balance: SupplierBalance })[]> {
  const allSuppliers = await getSuppliers();
  const result = await Promise.all(
    allSuppliers.map(async (s) => ({
      ...s,
      balance: await getSupplierBalance(s.id),
    }))
  );
  return result;
}
