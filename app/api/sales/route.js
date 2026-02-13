import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    const sales = await Sale.find({}).sort({ date: -1 });
    return NextResponse.json(sales);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { items, paymentMethod, grandTotal } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // 1. Update stock for each product in the cart
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -(Number(item.quantity) * Number(item.variant.quantity)) } }
      );
    }

    // 2. Use provided grandTotal or calculate it
    const finalTotal = grandTotal !== null && grandTotal !== undefined ? grandTotal :
      items.reduce((total, item) => total + item.price * item.quantity, 0);

    // 3. Create a single sale document
    const newSale = new Sale({
      items: items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        size: Number(item.variant.quantity),
      })),
      grandTotal: finalTotal,
      paymentMethod,
      date: new Date(),
    });

    await newSale.save();

    return NextResponse.json(newSale, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error creating sale' }, { status: 500 });
  }
}
