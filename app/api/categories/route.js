import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Obtener todas las categorías
export async function GET() {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    return Response.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'Error fetching categories' }, { status: 500 });
  }
}

// POST - Crear nueva categoría
export async function POST(request) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verificar si ya existe una categoría con el mismo nombre
    const [existingCategory] = await db.select().from(categories).where(eq(categories.name, name.trim()));
    if (existingCategory) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const [category] = await db.insert(categories).values({
      name: name.trim(),
      description: description?.trim() || '',
    }).returning();

    return Response.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ error: 'Error creating category' }, { status: 500 });
  }
}
