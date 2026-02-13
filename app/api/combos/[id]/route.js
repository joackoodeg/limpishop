import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { combos, comboProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function formatCombo(combo, comboProds) {
  return {
    ...combo,
    _id: combo.id,
    products: comboProds.map(cp => ({
      productId: cp.productId,
      productName: cp.productName,
      quantity: cp.quantity,
      price: cp.price,
    })),
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid combo ID' }, { status: 400 });
    }

    const [combo] = await db.select().from(combos).where(eq(combos.id, numId));

    if (!combo) {
      return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
    }

    const comboProds = await db.select().from(comboProducts).where(eq(comboProducts.comboId, numId));

    return NextResponse.json(formatCombo(combo, comboProds));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching combo' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid combo ID' }, { status: 400 });
    }

    const { name, description, products: comboProds, originalPrice, discountPercentage, finalPrice, active } = await request.json();

    const [combo] = await db.update(combos).set({
      name,
      description,
      originalPrice: Number(originalPrice),
      discountPercentage: Number(discountPercentage),
      finalPrice: Number(finalPrice),
      active: Boolean(active),
      updatedAt: new Date().toISOString(),
    }).where(eq(combos.id, numId)).returning();

    if (!combo) {
      return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
    }

    // Replace combo products: delete old, insert new
    await db.delete(comboProducts).where(eq(comboProducts.comboId, numId));
    if (comboProds && Array.isArray(comboProds) && comboProds.length > 0) {
      await db.insert(comboProducts).values(
        comboProds.map(cp => ({
          comboId: numId,
          productId: cp.productId ? Number(cp.productId) : null,
          productName: cp.productName,
          quantity: Number(cp.quantity),
          price: Number(cp.price),
        }))
      );
    }

    const newComboProds = await db.select().from(comboProducts).where(eq(comboProducts.comboId, numId));

    return NextResponse.json(formatCombo(combo, newComboProds));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error updating combo' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid combo ID' }, { status: 400 });
    }

    const [combo] = await db.delete(combos).where(eq(combos.id, numId)).returning();

    if (!combo) {
      return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
    }

    // comboProducts are cascade-deleted

    return NextResponse.json({ message: 'Combo deleted successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error deleting combo' }, { status: 500 });
  }
}
