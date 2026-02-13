import connectDB from '../../../../lib/mongodb';
import Category from '../../../../models/Category';
import Product from '../../../../models/Product';
import { deleteImage } from '../../../../lib/cloudinary';
import mongoose from 'mongoose';

// GET - Obtener categoría por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    await connectDB();
    const category = await Category.findById(id);
    
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
    const { name, description } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Verificar si ya existe otra categoría con el mismo nombre
    const existingCategory = await Category.findOne({ 
      name: name.trim(),
      _id: { $ne: id }
    });
    
    if (existingCategory) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description?.trim() || ''
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Actualizar categoryName en productos que usan esta categoría
    await Product.updateMany(
      { categoryId: id },
      { categoryName: category.name }
    );

    return Response.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Error updating category' }, { status: 500 });
  }
}

// DELETE - Eliminar categoría
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    await connectDB();
    
    // Verificar si existen productos asociados a esta categoría
    const productsWithCategory = await Product.findOne({ categoryId: id });
    if (productsWithCategory) {
      return Response.json({ 
        error: 'Cannot delete category. There are products associated with this category.' 
      }, { status: 400 });
    }

    const category = await Category.findById(id);
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if exists
    if (category.image?.publicId) {
      await deleteImage(category.image.publicId);
    }

    await Category.findByIdAndDelete(id);

    return Response.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ error: 'Error deleting category' }, { status: 500 });
  }
}
