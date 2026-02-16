import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockMovements, products } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

// GET /api/stock — list all stock movements with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const from = fromStr
      ? (fromStr.includes('T') ? fromStr : `${fromStr}T00:00:00`)
      : null;
    const to = toStr
      ? (toStr.includes('T') ? toStr : `${toStr}T23:59:59`)
      : null;

    const filters = [];
    if (productId) filters.push(eq(stockMovements.productId, Number(productId)));
    if (type) filters.push(eq(stockMovements.type, type));
    if (from) filters.push(gte(stockMovements.createdAt, from));
    if (to) filters.push(lte(stockMovements.createdAt, to));

    const query = db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
    const result = filters.length > 0
      ? await query.where(and(...filters))
      : await query;

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching stock movements' }, { status: 500 });
  }
}

// POST /api/stock — add reposicion or ajuste
export async function POST(request) {
  try {
    const { productId, quantity, type, note } = await request.json();

    if (!productId || quantity === undefined || quantity === null) {
      return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 });
    }

    const movementType = type || 'reposicion';
    if (!['reposicion', 'ajuste'].includes(movementType)) {
      return NextResponse.json({ error: 'Type must be reposicion or ajuste' }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty === 0) {
      return NextResponse.json({ error: 'Quantity must be a non-zero number' }, { status: 400 });
    }

    // For reposicion, quantity must be positive
    if (movementType === 'reposicion' && qty <= 0) {
      return NextResponse.json({ error: 'Reposición quantity must be positive' }, { status: 400 });
    }

    // Get current product stock
    const [product] = await db.select().from(products).where(eq(products.id, Number(productId)));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + qty);

    // Update product stock
    await db.update(products).set({
      stock: newStock,
      updatedAt: new Date().toISOString(),
    }).where(eq(products.id, Number(productId)));

    // Insert stock movement
    const [movement] = await db.insert(stockMovements).values({
      productId: Number(productId),
      productName: product.name,
      type: movementType,
      quantity: qty,
      previousStock,
      newStock,
      note: note || '',
    }).returning();

    return NextResponse.json({
      movement,
      product: { id: product.id, name: product.name, stock: newStock },
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating stock movement' }, { status: 500 });
  }
}
