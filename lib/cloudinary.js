import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file, options = {}) {
  try {
    // Verificar que las credenciales estén configuradas
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured. Please check your environment variables.');
    }

    // Merge default options with provided options
    const uploadOptions = {
      folder: options.folder || 'limpi',
      resource_type: 'auto',
      transformation: options.transformation || [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Error uploading image: ' + error.message);
  }
}

export async function deleteImage(publicId) {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

export function getProductImage(product, category = null) {
  // 1. Si el producto tiene imagen propia, usarla
  if (product?.imageUrl) {
    return {
      url: product.imageUrl,
      source: 'product',
      hasImage: true
    };
  }
  
  // 2. Si no, usar la imagen de la categoría
  const categoryToCheck = category || product?.category;
  if (categoryToCheck?.imageUrl) {
    return {
      url: categoryToCheck.imageUrl,
      source: 'category', 
      hasImage: true
    };
  }
  
  // 3. Si no, imagen por defecto
  return {
    url: '/images/default-product.svg',
    source: 'default',
    hasImage: false
  };
}

export function getCategoryImage(category) {
  if (category?.imageUrl) {
    return {
      url: category.imageUrl,
      hasImage: true
    };
  }
  
  return {
    url: '/images/default-category.svg',
    hasImage: false
  };
}

export function shouldDeleteImage(publicId) {
  return publicId && publicId !== '';
}

// Aliases for compatibility
export const uploadToCloudinary = uploadImage;
export const deleteFromCloudinary = deleteImage;

export default cloudinary;
