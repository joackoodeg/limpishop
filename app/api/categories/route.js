import connectDB from '../../../lib/mongodb';
import Category from '../../../models/Category';

// GET - Obtener todas las categorías
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 });
    
    return Response.json(categories);
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

    await connectDB();
    
    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim() || ''
    });

    await category.save();
    
    return Response.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Error creating category' }, { status: 500 });
  }
}
