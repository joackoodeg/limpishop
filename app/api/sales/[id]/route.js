import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 });
    }
    
    await connectDB();

    // Find the sale to get the productId and quantity
    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Check if it's a modern multi-product sale or legacy single-product sale
    if (sale.items && Array.isArray(sale.items)) {
      // Modern multi-product sale - restore stock for each item
      for (const item of sale.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: +(Number(item.quantity) * Number(item.size)) } }
        );
      }
    } else {
      // Legacy single-product sale - restore stock for single product
      await Product.findByIdAndUpdate(
        sale.productId,
        { $inc: { stock: +Number(sale.quantity) } }
      );
    }

    // Delete the sale
    await Sale.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Sale deleted' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error deleting sale' }, { status: 500 });
  }
}
