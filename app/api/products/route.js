import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productPrices, categories, stockMovements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Revalidate this route every 60 seconds (ISR)
export const revalidate = 60;

export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(products.name);

    // Attach prices for each product
    const allPrices = allProducts.length > 0
      ? await db.select().from(productPrices)
      : [];

    const pricesByProduct = {};
    for (const pp of allPrices) {
      if (!pricesByProduct[pp.productId]) pricesByProduct[pp.productId] = [];
      pricesByProduct[pp.productId].push({ quantity: pp.quantity, price: pp.price });
    }

    const result = allProducts.map(p => ({
      ...p,
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
    const { name, prices, cost, stock, description, categoryId, unit } = await request.json();

    const productData = {
      name,
      cost: Number(cost),
      stock: parseFloat(stock) || 0,
      unit: unit || 'unidad',
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

    // Register initial stock movement
    const initialStock = parseFloat(stock) || 0;
    if (initialStock > 0) {
      await db.insert(stockMovements).values({
        productId: inserted.id,
        productName: inserted.name,
        type: 'inicial',
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        note: 'Stock inicial al crear el producto',
      });
    }

    // Insert prices
    if (prices && Array.isArray(prices) && prices.length > 0) {
      await db.insert(productPrices).values(
        prices.map(p => ({
          productId: inserted.id,
          quantity: parseFloat(p.quantity) || 0,
          price: Number(p.price),
        }))
      );
    }

    // Fetch prices back
    const insertedPrices = await db.select().from(productPrices).where(eq(productPrices.productId, inserted.id));

    const result = {
      ...inserted,
      prices: insertedPrices.map(p => ({ quantity: p.quantity, price: p.price })),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
  }
}
