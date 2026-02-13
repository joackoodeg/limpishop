import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Product from '../../../../../models/Product';
import { uploadImage, deleteImage } from '../../../../../lib/cloudinary';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete old image if exists
    if (product.image?.publicId) {
      await deleteImage(product.image.publicId);
    }

    // Upload new image
    const imageData = await uploadImage(base64, 'limpi/products');

    // Update product with new image
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        image: {
          url: imageData.url,
          publicId: imageData.publicId
        }
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Image uploaded successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete image from Cloudinary
    if (product.image?.publicId) {
      await deleteImage(product.image.publicId);
    }

    // Remove image from product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        image: {
          url: null,
          publicId: null
        }
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Image deleted successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Error deleting image' }, { status: 500 });
  }
}
