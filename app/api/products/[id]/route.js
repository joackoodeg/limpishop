import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productPrices, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function formatProduct(product, prices) {
  return {
    ...product,
    prices: prices.map(p => ({ quantity: p.quantity, price: p.price })),
  };
}

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const [product] = await db.select().from(products).where(eq(products.id, numId));

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const prices = await db.select().from(productPrices).where(eq(productPrices.productId, numId));

    return NextResponse.json(formatProduct(product, prices));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching product' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const numId = Number(id);
    const { name, prices, cost, description, categoryId, active, featured, unit } = await request.json();

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const updateData = {
      name,
      cost: Number(cost),
      unit: unit || 'unidad',
      description,
      active: active !== undefined ? active : true,
      featured: featured !== undefined ? featured : false,
      updatedAt: new Date().toISOString(),
    };

    // Manejar la categoría
    if (categoryId === null || categoryId === '') {
      updateData.categoryId = null;
      updateData.categoryName = null;
    } else if (categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, Number(categoryId)));
      if (category) {
        updateData.categoryId = category.id;
        updateData.categoryName = category.name;
      }
    }

    const [updated] = await db.update(products).set(updateData).where(eq(products.id, numId)).returning();

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Replace prices: delete old, insert new
    await db.delete(productPrices).where(eq(productPrices.productId, numId));
    if (prices && Array.isArray(prices) && prices.length > 0) {
      await db.insert(productPrices).values(
        prices.map(p => ({
          productId: numId,
          quantity: parseFloat(p.quantity) || 0,
          price: Number(p.price),
        }))
      );
    }

    const newPrices = await db.select().from(productPrices).where(eq(productPrices.productId, numId));

    return NextResponse.json({ message: 'Product updated', product: formatProduct(updated, newPrices) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const [product] = await db.delete(products).where(eq(products.id, numId)).returning();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
  }
}
