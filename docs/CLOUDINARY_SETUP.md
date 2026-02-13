# Configuración de Cloudinary

## 🚀 Configuración Inicial

### 1. Crear cuenta en Cloudinary
1. Ve a [Cloudinary](https://cloudinary.com/) y crea una cuenta gratuita
2. Una vez registrado, ve a tu Dashboard
3. Copia las credenciales: Cloud Name, API Key y API Secret

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
MONGODB_URI=tu-mongodb-connection-string
JWT_SECRET=tu-jwt-secret
```

### 3. Verificar Configuración
Ejecuta el script de verificación:

```bash
npm run check:cloudinary
```

## 🔧 Funcionalidades Implementadas

### Para Categorías
- ✅ Subir imagen a cada categoría
- ✅ Eliminar imagen de categoría
- ✅ Vista previa de imagen en la gestión de categorías
- ✅ Limpieza automática de imágenes al eliminar categoría

### Para Productos
- ✅ Sistema de fallback de imágenes:
  1. Imagen propia del producto (si tiene)
  2. Imagen de la categoría del producto (si la categoría tiene imagen)
  3. Imagen por defecto
- ✅ API para subir/eliminar imágenes de productos
- ✅ Componente reutilizable para mostrar imágenes de productos
- ✅ Indicador de fuente de imagen (propia/categoría)

## 📁 Estructura de Carpetas en Cloudinary

```
limpi/
├── categories/     # Imágenes de categorías
└── products/       # Imágenes de productos
```

## 🧩 Componentes Creados

- `CategoryImage.tsx` - Muestra imágenes de categorías con fallback
- `ProductImage.tsx` - Muestra imágenes de productos con lógica de fallback
- `ImageUpload.tsx` - Componente reutilizable para subir imágenes

## 🔌 APIs Disponibles

- `POST /api/categories/[id]/image` - Subir imagen a categoría
- `DELETE /api/categories/[id]/image` - Eliminar imagen de categoría
- `POST /api/products/[id]/image` - Subir imagen a producto
- `DELETE /api/products/[id]/image` - Eliminar imagen de producto

## 🐛 Solución de Problemas

### Error: "Cloudinary credentials not configured"
**Solución:** Verifica que el archivo `.env.local` existe y tiene las variables correctas.

### Error: "Error uploading image"
**Solución:** 
1. Ejecuta `npm run check:cloudinary` para verificar la configuración
2. Revisa la consola del navegador para más detalles del error
3. Verifica que las credenciales de Cloudinary sean correctas

### Error: "No image file provided"
**Solución:** Asegúrate de seleccionar un archivo de imagen válido (JPG, PNG, GIF, WebP).

### Error: "File too large"
**Solución:** El archivo debe ser menor a 5MB. Comprime la imagen o usa una de menor resolución.

## 📝 Uso de los Componentes

### ImageUpload Component
```tsx
<ImageUpload
  entityType="product" // o "category"
  entityId={productId}
  currentImage={product.image?.url}
  onImageUploaded={(data) => {
    // Manejar la imagen subida
    console.log('Imagen subida:', data);
  }}
/>
```

### ProductImage Component
```tsx
<ProductImage product={product} category={category} />
```

### CategoryImage Component
```tsx
<CategoryImage category={category} />
```

## 🔄 Próximos Pasos

1. ✅ Agregar gestión de imágenes en formularios de edición de productos
2. Implementar múltiples imágenes por producto
3. Optimización adicional de imágenes (WebP, diferentes tamaños)
4. Galería de imágenes para productos
5. Compresión automática de imágenes antes de subir

## 📊 Monitoreo

Para verificar el estado de tu cuenta de Cloudinary:
1. Ve a tu Dashboard de Cloudinary
2. Revisa la sección "Usage" para ver el consumo de recursos
3. En la sección "Media Library" puedes ver todas las imágenes subidas
