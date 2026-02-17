import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, saleItems, products, stockMovements } from '@/lib/db/schema';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';

// Cache sales list for 30 seconds
export const revalidate = 30;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const from = fromStr
      ? (fromStr.includes('T') ? fromStr : `${fromStr}T00:00:00`)
      : null;
    const to = toStr
      ? (toStr.includes('T') ? toStr : `${toStr}T23:59:59`)
      : null;

    const filters = [];
    if (from) filters.push(gte(sales.date, from));
    if (to) filters.push(lte(sales.date, to));

    const salesQuery = db.select().from(sales).orderBy(desc(sales.date));
    const allSales = filters.length > 0
      ? await salesQuery.where(and(...filters))
      : await salesQuery;

    // Fetch all sale items
    const allItems = allSales.length > 0
      ? await db.select().from(saleItems)
      : [];

    const itemsBySale = {};
    for (const item of allItems) {
      if (!itemsBySale[item.saleId]) itemsBySale[item.saleId] = [];
      itemsBySale[item.saleId].push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        unit: item.unit || 'unidad',
      });
    }

    const result = allSales.map(s => ({
      ...s,
      items: itemsBySale[s.id] || [],
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { items, paymentMethod, grandTotal } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // 1. Read current stock for each product before any changes
    const stockSnapshots = {};
    for (const item of items) {
      const [currentProduct] = await db.select({ stock: products.stock, name: products.name })
        .from(products).where(eq(products.id, Number(item.productId)));
      stockSnapshots[item.productId] = {
        prevStock: currentProduct?.stock || 0,
        name: currentProduct?.name || item.name,
      };
    }

    // 2. Use provided grandTotal or calculate it
    const finalTotal = grandTotal !== null && grandTotal !== undefined
      ? grandTotal
      : items.reduce((total, item) => total + item.price * item.quantity, 0);

    // 3. Create a single sale record
    const [newSale] = await db.insert(sales).values({
      grandTotal: finalTotal,
      paymentMethod,
      date: new Date().toISOString(),
    }).returning();

    // 4. Insert sale items
    const saleItemsData = items.map(item => ({
      saleId: newSale.id,
      productId: Number(item.productId),
      productName: item.name,
      quantity: parseFloat(item.quantity),
      price: Number(item.price),
      size: parseFloat(item.variant.quantity),
      unit: item.unit || 'unidad',
    }));

    await db.insert(saleItems).values(saleItemsData);

    // 5. Update stock and register movements for each product
    for (const item of items) {
      const stockDecrement = parseFloat(item.quantity) * parseFloat(item.variant.quantity);
      const snapshot = stockSnapshots[item.productId];
      const newStock = Math.max(0, snapshot.prevStock - stockDecrement);

      await db.update(products).set({
        stock: newStock,
        updatedAt: new Date().toISOString(),
      }).where(eq(products.id, Number(item.productId)));

      await db.insert(stockMovements).values({
        productId: Number(item.productId),
        productName: snapshot.name,
        type: 'venta',
        quantity: -stockDecrement,
        previousStock: snapshot.prevStock,
        newStock: newStock,
        note: `Venta #${newSale.id}`,
        referenceId: newSale.id,
      });
    }

    // Fetch inserted items back
    const insertedItems = await db.select().from(saleItems).where(eq(saleItems.saleId, newSale.id));

    const result = {
      ...newSale,
      items: insertedItems.map(si => ({
        productId: si.productId,
        productName: si.productName,
        quantity: si.quantity,
        price: si.price,
        size: si.size,
        unit: si.unit || 'unidad',
      })),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating sale' }, { status: 500 });
  }
}
