import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

// GET - Obtener productos de una categoría
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const categoryProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, numId))
      .orderBy(products.name);

    return Response.json(categoryProducts);
  } catch (error) {
    console.error('Error fetching category products:', error);
    return Response.json({ error: 'Error fetching category products' }, { status: 500 });
  }
}

// PUT - Asignar múltiples productos a una categoría (bulk assign)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const { productIds } = await request.json();

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    if (!Array.isArray(productIds)) {
      return Response.json({ error: 'productIds must be an array' }, { status: 400 });
    }

    // Verificar que la categoría existe
    const [category] = await db.select().from(categories).where(eq(categories.id, numId));
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Asignar cada producto a la categoría
    if (productIds.length > 0) {
      const numericIds = productIds.map(Number);
      await db
        .update(products)
        .set({
          categoryId: numId,
          categoryName: category.name,
          updatedAt: now,
        })
        .where(inArray(products.id, numericIds));
    }

    return Response.json({
      message: `${productIds.length} producto(s) asignado(s) a "${category.name}"`,
      count: productIds.length,
    });
  } catch (error) {
    console.error('Error assigning products to category:', error);
    return Response.json({ error: 'Error assigning products' }, { status: 500 });
  }
}

// DELETE - Remover múltiples productos de una categoría (bulk unassign)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const { productIds } = await request.json();

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    if (!Array.isArray(productIds)) {
      return Response.json({ error: 'productIds must be an array' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (productIds.length > 0) {
      const numericIds = productIds.map(Number);
      await db
        .update(products)
        .set({
          categoryId: null,
          categoryName: null,
          updatedAt: now,
        })
        .where(inArray(products.id, numericIds));
    }

    return Response.json({
      message: `${productIds.length} producto(s) removido(s) de la categoría`,
      count: productIds.length,
    });
  } catch (error) {
    console.error('Error removing products from category:', error);
    return Response.json({ error: 'Error removing products' }, { status: 500 });
  }
}
