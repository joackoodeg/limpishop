import connectDB from '../../../../../lib/mongodb';
import Category from '../../../../../models/Category';
import { uploadImage, deleteImage } from '../../../../../lib/cloudinary';
import mongoose from 'mongoose';

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
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    
    // Parsear la imagen del form-data
    const base64Image = await parseFormData(request);
    
    await connectDB();
    
    // Verificar que la categoría existe
    const category = await Category.findById(id);
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Eliminar imagen anterior si existe
    if (category.image?.publicId) {
      await deleteImage(category.image.publicId);
    }
    
    // Subir la nueva imagen a Cloudinary
    const result = await uploadImage(base64Image, 'limpi/categories');
    
    // Actualizar la categoría con la nueva imagen
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        image: {
          url: result.url,
          publicId: result.publicId
        }
      },
      { new: true }
    );
    
    return Response.json({ 
      message: 'Image uploaded successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error uploading category image:', error);
    return Response.json({ 
      error: `Error uploading image: ${error.message}` 
    }, { status: 500 });
  }
}

// DELETE - Eliminar imagen de categoría
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    
    await connectDB();
    
    // Verificar que la categoría existe
    const category = await Category.findById(id);
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Eliminar imagen de Cloudinary si existe
    if (category.image?.publicId) {
      await deleteImage(category.image.publicId);
    }
    
    // Actualizar la categoría para eliminar la referencia a la imagen
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        image: {
          url: null,
          publicId: null
        }
      },
      { new: true }
    );
    
    return Response.json({ 
      message: 'Image deleted successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error deleting category image:', error);
    return Response.json({ 
      error: `Error deleting image: ${error.message}` 
    }, { status: 500 });
  }
}
