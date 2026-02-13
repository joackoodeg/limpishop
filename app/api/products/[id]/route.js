import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching product' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const { name, prices, cost, stock, description, categoryId, active, featured } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const updateData = { 
      name, 
      prices, 
      cost: Number(cost), 
      stock: Number(stock), 
      description,
      active: active !== undefined ? active : true,
      featured: featured !== undefined ? featured : false
    };

    // Manejar la categoría
    if (categoryId === null || categoryId === '') {
      // Remover categoría
      updateData.categoryId = null;
      updateData.categoryName = null;
    } else if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      // Validar y agregar categoría
      const category = await Category.findById(categoryId);
      if (category) {
        updateData.categoryId = categoryId;
        updateData.categoryName = category.name;
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product updated', product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product deleted' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
  }
}
