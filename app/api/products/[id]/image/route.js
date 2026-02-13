import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productPrices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

function formatProduct(product, prices) {
  return {
    ...product,
    _id: product.id,
    image: { url: product.imageUrl, publicId: product.imagePublicId },
    prices: prices.map(p => ({ quantity: p.quantity, price: p.price })),
  };
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

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
    const [product] = await db.select().from(products).where(eq(products.id, numId));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete old image if exists
    if (product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }

    // Upload new image
    const imageData = await uploadImage(base64, 'limpi/products');

    // Update product with new image
    const [updatedProduct] = await db.update(products).set({
      imageUrl: imageData.url,
      imagePublicId: imageData.publicId,
      updatedAt: new Date().toISOString(),
    }).where(eq(products.id, numId)).returning();

    const prices = await db.select().from(productPrices).where(eq(productPrices.productId, numId));

    return NextResponse.json({
      message: 'Image uploaded successfully',
      product: formatProduct(updatedProduct, prices),
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const [product] = await db.select().from(products).where(eq(products.id, numId));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete image from Cloudinary
    if (product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }

    // Remove image from product
    const [updatedProduct] = await db.update(products).set({
      imageUrl: null,
      imagePublicId: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(products.id, numId)).returning();

    const prices = await db.select().from(productPrices).where(eq(productPrices.productId, numId));

    return NextResponse.json({
      message: 'Image deleted successfully',
      product: formatProduct(updatedProduct, prices),
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Error deleting image' }, { status: 500 });
  }
}
