import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

function formatCategory(cat) {
  return {
    ...cat,
    _id: cat.id,
    image: { url: cat.imageUrl, publicId: cat.imagePublicId },
  };
}

// Función para procesar la imagen subida desde multipart form-data
async function parseFormData(request) {
  const formData = await request.formData();
  const file = formData.get('image');

  if (!file) {
    throw new Error('No image file provided');
  }

  // Leer el archivo como un array buffer
  const buffer = await file.arrayBuffer();

  // Convertir a base64 para Cloudinary
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

    // Parsear la imagen del form-data
    const base64Image = await parseFormData(request);

    // Verificar que la categoría existe
    const [category] = await db.select().from(categories).where(eq(categories.id, numId));
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Eliminar imagen anterior si existe
    if (category.imagePublicId) {
      await deleteImage(category.imagePublicId);
    }

    // Subir la nueva imagen a Cloudinary
    const result = await uploadImage(base64Image, 'limpi/categories');

    // Actualizar la categoría con la nueva imagen
    const [updatedCategory] = await db.update(categories).set({
      imageUrl: result.url,
      imagePublicId: result.publicId,
      updatedAt: new Date().toISOString(),
    }).where(eq(categories.id, numId)).returning();

    return Response.json({
      message: 'Image uploaded successfully',
      category: formatCategory(updatedCategory),
    });
  } catch (error) {
    console.error('Error uploading category image:', error);
    return Response.json({
      error: `Error uploading image: ${error.message}`,
    }, { status: 500 });
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

    // Verificar que la categoría existe
    const [category] = await db.select().from(categories).where(eq(categories.id, numId));
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Eliminar imagen de Cloudinary si existe
    if (category.imagePublicId) {
      await deleteImage(category.imagePublicId);
    }

    // Actualizar la categoría para eliminar la referencia a la imagen
    const [updatedCategory] = await db.update(categories).set({
      imageUrl: null,
      imagePublicId: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(categories.id, numId)).returning();

    return Response.json({
      message: 'Image deleted successfully',
      category: formatCategory(updatedCategory),
    });
  } catch (error) {
    console.error('Error deleting category image:', error);
    return Response.json({
      error: `Error deleting image: ${error.message}`,
    }, { status: 500 });
  }
}
