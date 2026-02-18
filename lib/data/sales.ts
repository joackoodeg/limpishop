import { db } from '@/lib/db';
import { sales, saleItems, products } from '@/lib/db/schema';
import { desc, and, gte, lte, inArray, eq } from 'drizzle-orm';
import { DEFAULT_UNIT } from '@/lib/constants';
import { normalizeDateTime } from '@/lib/utils/date';

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  size: number;
  unit?: string;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  grandTotal: number;
  paymentMethod: string;
  date: string;
}

export interface SalesFilters {
  from?: string;
  to?: string;
}

/**
 * Fetch all sales with their items server-side
 * Optimized to avoid N+1 query problem
 */
export async function getSales(filters?: SalesFilters): Promise<Sale[]> {
  try {
    const from = filters?.from ? normalizeDateTime(filters.from, false) : null;
    const to = filters?.to ? normalizeDateTime(filters.to, true) : null;

    // Build query with optional filters
    const filterConditions = [];
    if (from) filterConditions.push(gte(sales.date, from));
    if (to) filterConditions.push(lte(sales.date, to));

    const salesQuery = db.select().from(sales).orderBy(desc(sales.date));
    const allSales = filterConditions.length > 0
      ? await salesQuery.where(and(...filterConditions))
      : await salesQuery;

    // Fetch sale items only for the retrieved sales (optimized)
    const allItems = allSales.length > 0
      ? await db.select().from(saleItems)
          .where(inArray(saleItems.saleId, allSales.map(s => s.id)))
      : [];

    // Group items by sale ID
    const itemsBySale: Record<number, SaleItem[]> = {};
    for (const item of allItems) {
      if (!itemsBySale[item.saleId]) {
        itemsBySale[item.saleId] = [];
      }
      itemsBySale[item.saleId].push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        unit: item.unit || DEFAULT_UNIT,
      });
    }

    // Combine sales with their items
    const result: Sale[] = allSales.map(s => ({
      id: s.id,
      items: itemsBySale[s.id] || [],
      grandTotal: s.grandTotal,
      paymentMethod: s.paymentMethod,
      date: s.date,
    }));

    return result;
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}

/**
 * Fetch sales for a given cash register (caja) by id
 */
export async function getSalesByCashRegisterId(cashRegisterId: number): Promise<Sale[]> {
  try {
    const allSales = await db
      .select()
      .from(sales)
      .where(eq(sales.cashRegisterId, cashRegisterId))
      .orderBy(desc(sales.date));

    if (allSales.length === 0) return [];

    const allItems = await db
      .select()
      .from(saleItems)
      .where(inArray(saleItems.saleId, allSales.map((s) => s.id)));

    const itemsBySale: Record<number, SaleItem[]> = {};
    for (const item of allItems) {
      if (!itemsBySale[item.saleId]) itemsBySale[item.saleId] = [];
      itemsBySale[item.saleId].push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        unit: item.unit || DEFAULT_UNIT,
      });
    }

    return allSales.map((s) => ({
      id: s.id,
      items: itemsBySale[s.id] || [],
      grandTotal: s.grandTotal,
      paymentMethod: s.paymentMethod,
      date: s.date,
    }));
  } catch (error) {
    console.error('Error fetching sales by cash register:', error);
    return [];
  }
}

export interface ProductStat {
  id: number | null;
  productName: string;
  quantity: number;
  revenue: number;
  costUnit: number;
  costTotal: number;
  netRevenue: number;
}

export interface SalesSummary {
  from: string;
  to: string;
  overall: { units: number; revenue: number; cost: number; net: number };
  products: ProductStat[];
}

/**
 * Fetch sales summary by date range (server-side)
 */
export async function getSalesSummary(
  filters?: SalesFilters
): Promise<SalesSummary> {
  const today = new Date().toISOString().split('T')[0];
  const from = filters?.from ? normalizeDateTime(filters.from, false) : '1970-01-01T00:00:00';
  const to = filters?.to ? normalizeDateTime(filters.to, true) : `${today}T23:59:59`;

  try {
    const rows = await db
      .select({
        productId: saleItems.productId,
        productName: saleItems.productName,
        quantity: saleItems.quantity,
        price: saleItems.price,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(gte(sales.date, from), lte(sales.date, to)));

    const productMap: Record<
      string,
      { id: number | null; productName: string; quantity: number; revenue: number }
    > = {};
    for (const row of rows) {
      const key = String(row.productId ?? row.productName);
      if (!productMap[key]) {
        productMap[key] = {
          id: row.productId,
          productName: row.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productMap[key].quantity += row.quantity;
      productMap[key].revenue += row.price * row.quantity;
    }

    const productIds = Object.values(productMap)
      .map((p) => p.id)
      .filter((id): id is number => id != null);
    const productCosts: Record<number, number> = {};
    if (productIds.length > 0) {
      const prods = await db
        .select({ id: products.id, cost: products.cost })
        .from(products);
      for (const p of prods) {
        productCosts[p.id] = p.cost ?? 0;
      }
    }

    const productStats: ProductStat[] = Object.values(productMap).map((p) => {
      const costUnit = p.id ? productCosts[p.id] ?? 0 : 0;
      const costTotal = costUnit * p.quantity;
      const netRevenue = p.revenue - costTotal;
      return {
        id: p.id,
        productName: p.productName,
        quantity: p.quantity,
        revenue: p.revenue,
        costUnit,
        costTotal,
        netRevenue,
      };
    });
    productStats.sort((a, b) => b.quantity - a.quantity);

    const overall = productStats.reduce(
      (acc, p) => {
        acc.units += p.quantity;
        acc.revenue += p.revenue;
        acc.cost += p.costTotal;
        return acc;
      },
      { units: 0, revenue: 0, cost: 0 }
    );

    return {
      from,
      to,
      overall: { ...overall, net: overall.revenue - overall.cost },
      products: productStats,
    };
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return {
      from,
      to,
      overall: { units: 0, revenue: 0, cost: 0, net: 0 },
      products: [],
    };
  }
}
