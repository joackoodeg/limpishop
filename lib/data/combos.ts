import { db } from '@/lib/db';
import { combos, comboProducts } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export interface ComboProduct {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Combo {
  id: number;
  name: string;
  description: string | null;
  originalPrice: number;
  discountPercentage: number;
  finalPrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  products: ComboProduct[];
}

function formatCombo(row: typeof combos.$inferSelect, products: ComboProduct[]): Combo {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    originalPrice: row.originalPrice,
    discountPercentage: row.discountPercentage,
    finalPrice: row.finalPrice,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    products,
  };
}

/**
 * Fetch all combos with their products (server-side)
 */
export async function getCombos(): Promise<Combo[]> {
  try {
    const allCombos = await db.select().from(combos).orderBy(asc(combos.name));
    if (allCombos.length === 0) return [];

    const allComboProducts = await db.select().from(comboProducts);
    const byComboId: Record<number, ComboProduct[]> = {};
    for (const cp of allComboProducts) {
      if (!byComboId[cp.comboId]) byComboId[cp.comboId] = [];
      byComboId[cp.comboId].push({
        productId: cp.productId,
        productName: cp.productName,
        quantity: cp.quantity,
        price: cp.price,
      });
    }

    return allCombos.map((c) => formatCombo(c, byComboId[c.id] ?? []));
  } catch (error) {
    console.error('Error fetching combos:', error);
    return [];
  }
}

/**
 * Fetch a single combo by ID with its products (server-side)
 */
export async function getComboById(id: number): Promise<Combo | null> {
  try {
    const [combo] = await db.select().from(combos).where(eq(combos.id, id));
    if (!combo) return null;

    const comboProds = await db
      .select()
      .from(comboProducts)
      .where(eq(comboProducts.comboId, id));

    return formatCombo(combo, comboProds.map((cp) => ({
      productId: cp.productId,
      productName: cp.productName,
      quantity: cp.quantity,
      price: cp.price,
    })));
  } catch (error) {
    console.error('Error fetching combo:', error);
    return null;
  }
}
