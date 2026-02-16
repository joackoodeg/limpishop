import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockMovements, products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/stock/[productId] — get stock movements for a specific product
export async function GET(request, { params }) {
  try {
    const { productId } = await params;
    const numId = Number(productId);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get product info
    const [product] = await db.select().from(products).where(eq(products.id, numId));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get limit param (optional, for mini-history on product detail page)
    const { searchParams } = new URL(request.url);
    const limitStr = searchParams.get('limit');

    let query = db.select().from(stockMovements)
      .where(eq(stockMovements.productId, numId))
      .orderBy(desc(stockMovements.createdAt));

    const movements = limitStr
      ? await query.limit(Number(limitStr))
      : await query;

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        stock: product.stock,
        unit: product.unit,
      },
      movements,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching stock movements' }, { status: 500 });
  }
}
