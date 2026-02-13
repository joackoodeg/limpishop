'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function CategoryImage({ 
  category, 
  width = 300, 
  height = 300, 
  className = "" 
}) {
  const [imageError, setImageError] = useState(false);
  
  const getImageUrl = () => {
    if (category?.imageUrl && !imageError) {
      return category.imageUrl;
    }
    return '/images/default-category.svg';
  };
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src={getImageUrl()}
        alt={`Imagen de ${category?.name || 'categoría'}`}
        width={width}
        height={height}
        className="object-cover rounded-lg"
        onError={() => setImageError(true)}
        priority={false}
      />
    </div>
  );
}
