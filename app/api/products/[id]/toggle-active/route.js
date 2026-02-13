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

    // Cambiar el estado activo
    const newActiveState = !product.active;
    
    await Product.findByIdAndUpdate(
      id,
      { active: newActiveState },
      { new: true }
    );

    return NextResponse.json({ 
      message: `Product ${newActiveState ? 'activated' : 'deactivated'} successfully`,
      active: newActiveState 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error toggling product status' }, { status: 500 });
  }
}
