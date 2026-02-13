import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productPrices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const featuredProducts = await db.select().from(products)
      .where(and(eq(products.featured, true), eq(products.active, true)))
      .orderBy(products.name);

    // Attach prices
    const allPrices = featuredProducts.length > 0
      ? await db.select().from(productPrices)
      : [];

    const pricesByProduct = {};
    for (const pp of allPrices) {
      if (!pricesByProduct[pp.productId]) pricesByProduct[pp.productId] = [];
      pricesByProduct[pp.productId].push({ quantity: pp.quantity, price: pp.price });
    }

    const result = featuredProducts.map(p => ({
      ...p,
      _id: p.id,
      image: { url: p.imageUrl, publicId: p.imagePublicId },
      prices: pricesByProduct[p.id] || [],
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching featured products' }, { status: 500 });
  }
}
