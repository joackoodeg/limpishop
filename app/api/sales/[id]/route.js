import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, saleItems, products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 });
    }

    // Find the sale
    const [sale] = await db.select().from(sales).where(eq(sales.id, numId));
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Get sale items to restore stock
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, numId));

    // Restore stock for each item
    for (const item of items) {
      if (item.productId) {
        const stockIncrement = Number(item.quantity) * Number(item.size || 1);
        await db.update(products).set({
          stock: sql`${products.stock} + ${stockIncrement}`,
          updatedAt: new Date().toISOString(),
        }).where(eq(products.id, item.productId));
      }
    }

    // Delete the sale (sale_items cascade-deleted)
    await db.delete(sales).where(eq(sales.id, numId));

    return NextResponse.json({ message: 'Sale deleted' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error deleting sale' }, { status: 500 });
  }
}
