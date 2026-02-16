import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, saleItems, products, stockMovements } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 });
    }

    const [sale] = await db.select().from(sales).where(eq(sales.id, numId));
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, numId));

    const result = {
      ...sale,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        unit: item.unit || 'unidad',
      })),
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching sale' }, { status: 500 });
  }
}

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

    // Restore stock for each item and register devolucion movements
    for (const item of items) {
      if (item.productId) {
        const stockIncrement = parseFloat(item.quantity) * parseFloat(item.size || 1);

        // Get current stock
        const [currentProduct] = await db.select({ stock: products.stock })
          .from(products).where(eq(products.id, item.productId));
        const prevStock = currentProduct?.stock || 0;
        const newStock = prevStock + stockIncrement;

        await db.update(products).set({
          stock: newStock,
          updatedAt: new Date().toISOString(),
        }).where(eq(products.id, item.productId));

        await db.insert(stockMovements).values({
          productId: item.productId,
          productName: item.productName,
          type: 'devolucion',
          quantity: stockIncrement,
          previousStock: prevStock,
          newStock: newStock,
          note: `Devolución por eliminación de venta #${numId}`,
          referenceId: numId,
        });
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
