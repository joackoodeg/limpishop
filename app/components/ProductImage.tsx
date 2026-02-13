'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductImage({ 
  product, 
  category = null, 
  width = 300, 
  height = 300, 
  className = "",
  showSource = false 
}) {
  const [imageError, setImageError] = useState(false);
  
  // Determinar qué imagen usar
  const getImageInfo = () => {
    // 1. Imagen del producto
    if (product?.image?.url && !imageError) {
      return {
        url: product.image.url,
        source: 'product',
        alt: `Imagen de ${product.name}`
      };
    }
    
    // 2. Imagen de la categoría
    const categoryToCheck = category || product?.category;
    if (categoryToCheck?.image?.url && !imageError) {
      return {
        url: categoryToCheck.image.url,
        source: 'category',
        alt: `Imagen de categoría ${categoryToCheck.name}`
      };
    }
    
    // 3. Imagen por defecto
    return {
      url: '/images/default-product.svg',
      source: 'default',
      alt: 'Imagen por defecto'
    };
  };
  
  const imageInfo = getImageInfo();
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageInfo.url}
        alt={imageInfo.alt}
        width={width}
        height={height}
        className="object-cover rounded-lg"
        onError={() => setImageError(true)}
        priority={false}
      />
      
      {/* Badge indicando fuente de imagen (opcional) */}
      {showSource && imageInfo.source !== 'default' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {imageInfo.source === 'product' ? 'Imagen propia' : 'De categoría'}
        </div>
      )}
    </div>
  );
}
