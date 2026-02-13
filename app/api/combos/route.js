import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { combos, comboProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function formatCombo(combo, comboProds) {
  return {
    ...combo,
    products: comboProds.map(cp => ({
      productId: cp.productId,
      productName: cp.productName,
      quantity: cp.quantity,
      price: cp.price,
    })),
  };
}

export async function GET() {
  try {
    const allCombos = await db.select().from(combos).orderBy(combos.name);

    // Fetch all combo products
    const allComboProducts = allCombos.length > 0
      ? await db.select().from(comboProducts)
      : [];

    const prodsByCombo = {};
    for (const cp of allComboProducts) {
      if (!prodsByCombo[cp.comboId]) prodsByCombo[cp.comboId] = [];
      prodsByCombo[cp.comboId].push(cp);
    }

    const result = allCombos.map(c => formatCombo(c, prodsByCombo[c.id] || []));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching combos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, description, products: comboProds, originalPrice, discountPercentage, finalPrice } = await request.json();

    const [combo] = await db.insert(combos).values({
      name,
      description,
      originalPrice: Number(originalPrice),
      discountPercentage: Number(discountPercentage),
      finalPrice: Number(finalPrice),
      active: true,
    }).returning();

    // Insert combo products
    if (comboProds && Array.isArray(comboProds) && comboProds.length > 0) {
      await db.insert(comboProducts).values(
        comboProds.map(cp => ({
          comboId: combo.id,
          productId: cp.productId ? Number(cp.productId) : null,
          productName: cp.productName,
          quantity: Number(cp.quantity),
          price: Number(cp.price),
        }))
      );
    }

    const insertedProducts = await db.select().from(comboProducts).where(eq(comboProducts.comboId, combo.id));

    return NextResponse.json(formatCombo(combo, insertedProducts), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating combo' }, { status: 500 });
  }
}
