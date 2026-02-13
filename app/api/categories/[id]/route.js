import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { deleteImage } from '@/lib/cloudinary';

// GET - Obtener categoría por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const [category] = await db.select().from(categories).where(eq(categories.id, numId));

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    return Response.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return Response.json({ error: 'Error fetching category' }, { status: 500 });
  }
}

// PUT - Actualizar categoría
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const { name, description } = await request.json();

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verificar si ya existe otra categoría con el mismo nombre
    const [existingCategory] = await db.select().from(categories)
      .where(and(eq(categories.name, name.trim()), ne(categories.id, numId)));

    if (existingCategory) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const [category] = await db.update(categories).set({
      name: name.trim(),
      description: description?.trim() || '',
      updatedAt: new Date().toISOString(),
    }).where(eq(categories.id, numId)).returning();

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Actualizar categoryName en productos que usan esta categoría
    await db.update(products).set({
      categoryName: category.name,
      updatedAt: new Date().toISOString(),
    }).where(eq(products.categoryId, numId));

    return Response.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    return Response.json({ error: 'Error updating category' }, { status: 500 });
  }
}

// DELETE - Eliminar categoría
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Verificar si existen productos asociados a esta categoría
    const [productsWithCategory] = await db.select().from(products).where(eq(products.categoryId, numId)).limit(1);
    if (productsWithCategory) {
      return Response.json({
        error: 'Cannot delete category. There are products associated with this category.',
      }, { status: 400 });
    }

    const [category] = await db.select().from(categories).where(eq(categories.id, numId));
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if exists
    if (category.imagePublicId) {
      await deleteImage(category.imagePublicId);
    }

    await db.delete(categories).where(eq(categories.id, numId));

    return Response.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ error: 'Error deleting category' }, { status: 500 });
  }
}
