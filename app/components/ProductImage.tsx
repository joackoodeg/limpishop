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
    if (product?.imageUrl && !imageError) {
      return {
        url: product.imageUrl,
        source: 'product',
        alt: `Imagen de ${product.name}`
      };
    }
    
    // 2. Imagen de la categoría (pasada como prop)
    if (category?.imageUrl && !imageError) {
      return {
        url: category.imageUrl,
        source: 'category',
        alt: `Imagen de categoría ${category.name || product?.categoryName || 'categoría'}`
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
