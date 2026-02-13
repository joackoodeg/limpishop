import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function PATCH(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Obtener el producto actual
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Cambiar el estado destacado
    const newFeaturedState = !product.featured;
    
    await Product.findByIdAndUpdate(
      id,
      { featured: newFeaturedState },
      { new: true }
    );

    return NextResponse.json({ 
      message: `Product ${newFeaturedState ? 'featured' : 'unfeatured'} successfully`,
      featured: newFeaturedState 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error toggling product featured status' }, { status: 500 });
  }
}
