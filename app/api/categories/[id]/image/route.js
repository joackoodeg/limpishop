import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

// Función para procesar la imagen subida desde multipart form-data
async function parseFormData(request) {
  const formData = await request.formData();
  const file = formData.get('image');

  if (!file) {
    throw new Error('No image file provided');
  }

  const buffer = await file.arrayBuffer();
  const base64String = Buffer.from(buffer).toString('base64');
  const base64Image = `data:${file.type};base64,${base64String}`;

  return base64Image;
}

// POST - Subir imagen de categoría
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const base64Image = await parseFormData(request);

    const [category] = await db.select().from(categories).where(eq(categories.id, numId));
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.imagePublicId) {
      await deleteImage(category.imagePublicId);
    }

    const result = await uploadImage(base64Image, 'limpi/categories');

    const [updatedCategory] = await db.update(categories).set({
      imageUrl: result.url,
      imagePublicId: result.publicId,
      updatedAt: new Date().toISOString(),
    }).where(eq(categories.id, numId)).returning();

    return Response.json({
      message: 'Image uploaded successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Error uploading category image:', error);
    return Response.json({ error: `Error uploading image: ${error.message}` }, { status: 500 });
  }
}

// DELETE - Eliminar imagen de categoría
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (isNaN(numId)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const [category] = await db.select().from(categories).where(eq(categories.id, numId));
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.imagePublicId) {
      await deleteImage(category.imagePublicId);
    }

    const [updatedCategory] = await db.update(categories).set({
      imageUrl: null,
      imagePublicId: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(categories.id, numId)).returning();

    return Response.json({
      message: 'Image deleted successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Error deleting category image:', error);
    return Response.json({ error: `Error deleting image: ${error.message}` }, { status: 500 });
  }
}
