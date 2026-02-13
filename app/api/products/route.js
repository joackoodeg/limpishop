import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productPrices, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(products.name);

    // Attach prices for each product
    const productIds = allProducts.map(p => p.id);
    const allPrices = productIds.length > 0
      ? await db.select().from(productPrices)
      : [];

    const pricesByProduct = {};
    for (const pp of allPrices) {
      if (!pricesByProduct[pp.productId]) pricesByProduct[pp.productId] = [];
      pricesByProduct[pp.productId].push({ quantity: pp.quantity, price: pp.price });
    }

    const result = allProducts.map(p => ({
      ...p,
      _id: p.id,
      image: { url: p.imageUrl, publicId: p.imagePublicId },
      prices: pricesByProduct[p.id] || [],
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, prices, cost, stock, description, categoryId } = await request.json();

    const productData = {
      name,
      cost: Number(cost),
      stock: Number(stock),
      description,
      active: true,
      featured: false,
    };

    // Si se proporciona una categoría, validar y agregar la información
    if (categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, Number(categoryId)));
      if (category) {
        productData.categoryId = category.id;
        productData.categoryName = category.name;
      }
    }

    const [inserted] = await db.insert(products).values(productData).returning();

    // Insert prices
    if (prices && Array.isArray(prices) && prices.length > 0) {
      await db.insert(productPrices).values(
        prices.map(p => ({
          productId: inserted.id,
          quantity: Number(p.quantity),
          price: Number(p.price),
        }))
      );
    }

    // Fetch prices back
    const insertedPrices = await db.select().from(productPrices).where(eq(productPrices.productId, inserted.id));

    const result = {
      ...inserted,
      _id: inserted.id,
      image: { url: inserted.imageUrl, publicId: inserted.imagePublicId },
      prices: insertedPrices.map(p => ({ quantity: p.quantity, price: p.price })),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
  }
}
