import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Obtener el producto actual
    const [product] = await db.select().from(products).where(eq(products.id, numId));

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Cambiar el estado destacado
    const newFeaturedState = !product.featured;

    await db.update(products).set({
      featured: newFeaturedState,
      updatedAt: new Date().toISOString(),
    }).where(eq(products.id, numId));

    return NextResponse.json({
      message: `Product ${newFeaturedState ? 'featured' : 'unfeatured'} successfully`,
      featured: newFeaturedState,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error toggling product featured status' }, { status: 500 });
  }
}
