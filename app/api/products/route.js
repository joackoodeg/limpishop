import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ name: 1 });
    return NextResponse.json(products);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { name, prices, cost, stock, description, categoryId } = await request.json();
    
    const productData = { 
      name, 
      prices, 
      cost: Number(cost), 
      stock: Number(stock), 
      description,
      active: true,
      featured: false
    };

    // Si se proporciona una categoría, validar y agregar la información
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      const category = await Category.findById(categoryId);
      if (category) {
        productData.categoryId = categoryId;
        productData.categoryName = category.name;
      }
    }

    const product = new Product(productData);
    await product.save();
    
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
  }
}
