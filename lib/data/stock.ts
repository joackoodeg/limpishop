import { db } from '@/lib/db';
import { stockMovements } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string;
  referenceId: number | null;
  createdAt: string;
}

/**
 * Fetch recent stock movements for a product (server-side)
 */
export async function getStockMovements(
  productId: number,
  limit = 5
): Promise<StockMovement[]> {
  try {
    const rows = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      quantity: r.quantity,
      previousStock: r.previousStock,
      newStock: r.newStock,
      note: r.note ?? '',
      referenceId: r.referenceId,
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }
}
