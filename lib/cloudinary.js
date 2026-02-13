import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file, folder = 'limpi') {
  try {
    // Verificar que las credenciales estén configuradas
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured. Please check your environment variables.');
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
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
  if (product?.image?.url) {
    return {
      url: product.image.url,
      source: 'product',
      hasImage: true
    };
  }
  
  // 2. Si no, usar la imagen de la categoría (puede venir como parámetro o poblada en el producto)
  const categoryToCheck = category || product?.category;
  if (categoryToCheck?.image?.url) {
    return {
      url: categoryToCheck.image.url,
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
  if (category?.image?.url) {
    return {
      url: category.image.url,
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

export default cloudinary;
