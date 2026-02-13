'use client';

import { useState, useRef } from 'react';

export default function ImageUpload({ 
  onImageUploaded, 
  currentImage = null, 
  entityType = 'product', // 'product' o 'category'
  entityId = null,
  className = "" 
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }
    
    await uploadImage(file);
  };
  
  const uploadImage = async (file) => {
    if (!entityId) {
      setError('ID de entidad requerido para subir imagen');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Construir URL correcta según el tipo de entidad
      const apiPath = entityType === 'category' ? 'categories' : `${entityType}s`;
      const response = await fetch(`/api/${apiPath}/${entityId}/image`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen');
      }
      
      // Notificar al componente padre
      onImageUploaded?.(data);
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  const deleteImage = async () => {
    if (!entityId || !currentImage) return;
    
    setUploading(true);
    setError('');
    
    try {
      // Construir URL correcta según el tipo de entidad
      const apiPath = entityType === 'category' ? 'categories' : `${entityType}s`;
      const response = await fetch(`/api/${apiPath}/${entityId}/image`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar imagen');
      }
      
      // Notificar al componente padre
      onImageUploaded?.(data);
      
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Vista previa de imagen actual */}
      {currentImage && (
        <div className="relative">
          <img
            src={currentImage}
            alt="Imagen actual"
            className="w-32 h-32 object-cover rounded-lg border"
          />
          <button
            onClick={deleteImage}
            disabled={uploading}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:opacity-50"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Input de archivo */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`image-upload-${entityType}-${entityId}`}
        />
        <label
          htmlFor={`image-upload-${entityType}-${entityId}`}
          className={`
            inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Subiendo...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {currentImage ? 'Cambiar imagen' : 'Subir imagen'}
            </>
          )}
        </label>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {/* Información */}
      <div className="text-gray-500 text-sm">
        Formatos soportados: JPG, PNG, GIF, WebP. Máximo 5MB.
      </div>
    </div>
  );
}
