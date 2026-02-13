# Plan de Implementación: Precios por Variante de Producto

Este documento describe la estrategia propuesta para modificar el sistema y permitir que un solo producto tenga múltiples precios asociados a diferentes tamaños o medidas (ej. 1.5 litros, 2.5 litros), en lugar de un único precio fijo.

## 1. Resumen del Cambio

El objetivo es pasar de un modelo de `precio único` por producto a un modelo de `variantes de precio`. Esto permitirá una mayor flexibilidad para productos que se venden en diferentes formatos pero comparten un costo base (ej. costo por litro).

## 2. Modificaciones Propuestas

### 2.1. Modelo de Datos (`models/Product.js`)

Se modificará el esquema de Mongoose para el modelo `Product`.

**Cambios:**

1.  **Eliminar `price`:** El campo actual `price: Number` será eliminado.
2.  **Añadir `priceVariants`:** Se introducirá un nuevo campo `priceVariants`, que será un array de objetos.

**Esquema Propuesto:**

```javascript
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cost: { type: Number, required: true }, // Costo base (ej. por litro)
  stock: { type: Number, required: true },
  description: { type: String },
  priceVariants: {
    type: [{
      size: { type: Number, required: true }, // ej. 1.5, 2, 5 (representando litros)
      price: { type: Number, required: true } // ej. 150, 200, 450
    }],
    required: true,
    default: []
  }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
```

### 2.2. API de Productos (`/api/products/...`)

Las rutas de la API que crean (`POST`) y actualizan (`PUT`) productos deberán ser ajustadas para manejar el nuevo array `priceVariants`.

-   **`POST /api/products` (Crear):** El cuerpo de la solicitud esperará `priceVariants` en lugar de `price`.
-   **`PUT /api/products/[id]` (Actualizar):** El cuerpo de la solicitud también esperará `priceVariants`.

### 2.3. Interfaz de Usuario (UI/UX)

#### a. Creación de Productos (`/app/products/new/page.tsx`)

El formulario de creación será rediseñado para gestionar dinámicamente las variantes.

-   **Estado:** Se usará un estado de React para manejar un array de variantes (ej. `const [variants, setVariants] = useState([{ size: '', price: '' }])`).
-   **Campos Dinámicos:**
    -   Habrá un botón "Añadir Variante" que agregará un nuevo objeto al estado `variants`, renderizando una nueva fila de campos de entrada para "Tamaño" y "Precio".
    -   Cada fila de variante tendrá un botón "Eliminar" para quitarla del estado.
-   **Envío:** Al enviar el formulario, se mandará el array `variants` completo al backend.

#### b. Edición de Productos (`/app/products/[id]/edit/page.tsx`)

La página de edición funcionará de manera similar a la de creación.

-   **Carga de Datos:** Al cargar la página, se obtendrán los datos del producto y se poblará el estado `variants` con los datos existentes de `product.priceVariants`.
-   **Funcionalidad:** El usuario podrá editar las variantes existentes, añadir nuevas o eliminarlas, tal como en el formulario de creación.

### 2.4. Flujo de Venta y Visualización

Esta es la parte más crítica del cambio desde la perspectiva del usuario final.

#### a. Tabla Principal de Productos (`/app/products/page.tsx`)

La columna "Precio" ya no es viable. Propongo dos alternativas:

1.  **Mostrar Rango de Precios:** La columna podría mostrar el precio mínimo y máximo de las variantes (ej. "$150 - $450").
2.  **Texto Indicativo:** La columna podría simplemente decir "Ver Precios" o "Múltiples Precios".

#### b. Proceso de Venta (`handleSell` function)

El flujo de venta debe ser modificado para que el usuario seleccione qué variante del producto está vendiendo.

1.  **Click en "Vender":** Al hacer clic, en lugar de un `prompt` para la cantidad, se abrirá un **modal (o un diálogo más complejo)**.
2.  **Modal de Venta:** Este modal mostrará:
    -   El nombre del producto.
    -   Una lista de las variantes disponibles para ese producto (ej. "1.5 litros - $150", "2.5 litros - $250").
    -   Un campo de entrada para la **cantidad** junto a cada variante.
3.  **Confirmación:** El usuario seleccionará la variante y la cantidad y confirmará la venta.
4.  **API de Ventas (`/api/sales`):** La solicitud a la API de ventas ahora deberá incluir no solo el `productId`, sino también la información de la variante vendida (`size` y `price`) para un registro preciso.

#### c. Modelo de Ventas (`models/Sale.js`)

Podría ser útil actualizar el modelo `Sale` para guardar qué variante específica se vendió.

**Esquema de Venta Propuesto:**

```javascript
import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  // Guardar la variante específica que se vendió
  soldVariant: {
    size: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  total: { type: Number, required: true } // quantity * soldVariant.price
}, { timestamps: true });

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
```

## 3. Resumen de Pasos de Implementación

1.  **Backend:**
    -   Modificar `models/Product.js`.
    -   Modificar `models/Sale.js` (opcional pero recomendado).
    -   Actualizar las rutas `POST` y `PUT` en la API de productos.
    -   Actualizar la ruta `POST` en la API de ventas.
2.  **Frontend:**
    -   Actualizar el estado y la UI en `app/products/new/page.tsx`.
    -   Actualizar el estado y la UI en `app/products/[id]/edit/page.tsx`.
    -   Modificar la tabla de productos en `app/products/page.tsx` para reflejar los nuevos precios.
    -   Reimplementar la función `handleSell` y crear un modal de venta.
    -   Actualizar la página de detalles del producto (`/products/[id]`) para listar las variantes.

Este enfoque modulariza el precio y ofrece la flexibilidad requerida, aunque implica una refactorización significativa en varias partes de la aplicación.
