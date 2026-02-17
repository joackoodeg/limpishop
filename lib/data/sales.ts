import { db } from '@/lib/db';
import { sales, saleItems } from '@/lib/db/schema';
import { desc, and, gte, lte, inArray } from 'drizzle-orm';
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
