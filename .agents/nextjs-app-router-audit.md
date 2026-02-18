# Auditoría: Uso de patrones Next.js App Router

Basado en el skill `.agents/skills/nextjs-app-router-patterns`. Lugares donde el proyecto **no** aprovecha la estructura ideal de Next.js.

---

## 1. Convenciones de archivos faltantes

| Convención | Estado | Ubicación recomendada |
|------------|--------|------------------------|
| **error.tsx** | ❌ No existe | `app/error.tsx` (y opcionalmente por ruta: `app/sales/error.tsx`, etc.) |
| **not-found.tsx** | ❌ No existe | `app/not-found.tsx` |
| **loading.tsx por ruta** | ⚠️ Solo en raíz | Existe `app/loading.tsx` pero no hay `app/sales/loading.tsx`, `app/products/loading.tsx`, `app/categories/loading.tsx`, etc. |

**Según el skill:** *"Don't ignore loading states - Always provide loading.tsx or Suspense"* y las convenciones incluyen `error.tsx` y `not-found.tsx`.

---

## 2. Páginas que deberían ser Server Components

El skill indica: **"Start with Server Components - Add 'use client' only when needed"** y **"Don't fetch in Client Components - Use Server Components or React Query"**.

### 2.1 Dashboard (`app/page.tsx`)

- **Problema:** Página raíz es `'use client'` y hace `fetch('/api/auth/me')` y `fetch('/api/products')` + `fetch('/api/sales/summary')` en `useEffect`.
- **Ya existe:** `lib/data/dashboard.ts` → `getDashboardStats()`.
- **Ideal:** Página Server Component que llame a `getDashboardStats()` y opcionalmente a una función para el usuario (o leer sesión en server). Pasar datos a componentes cliente solo para la parte interactiva (quick links, filtrado por módulo).

### 2.2 Ventas (`app/sales/page.tsx`)

- **Problema:** Todo en cliente con `useEffect` → `fetch('/api/sales')`.
- **Ya existe:** `lib/data/sales.ts` → `getSales(filters?)`.
- **Ideal:** Server Component que reciba `searchParams` (from, to, query si se pasa por URL), llame a `getSales()`, y renderice una lista. Filtros y paginación pueden vivir en un Client Component que use `searchParams`/router para la URL y reciba `initialSales`.

### 2.3 Categorías (`app/categories/page.tsx`)

- **Problema:** `'use client'` + `fetch('/api/categories')` en `useEffect`. Toda la carga inicial en cliente.
- **Ideal:** Server Component que use una función en `lib/data` (o fetch interno) para cargar categorías; pasar `initialCategories` a un Client Component para formularios, edición, eliminación e imagen. Mutaciones con Server Actions o revalidate después de API.

### 2.4 Combos lista (`app/combos/page.tsx`)

- **Problema:** `'use client'` + `fetch('/api/combos')` en `useEffect`.
- **Ideal:** Server Component que cargue combos en servidor y pase a un Client Component para acciones (toggle, delete, PDF, paginación).

### 2.5 Detalle de producto (`app/products/[id]/page.tsx`)

- **Problema:** `'use client'` + `useParams()` + `fetch(`/api/products/${id}`)` y `fetch('/api/stock/...')` en `useEffect`.
- **Ya existe:** `lib/data/products.ts` → `getProductById(id)`.
- **Ideal:** Server Component async que reciba `params: Promise<{ id: string }>`, haga `await params`, llame a `getProductById(Number(id))` y, si no existe, `notFound()`. Los botones Editar/Eliminar y el bloque de movimientos de stock pueden ser Client Components que reciban el producto ya cargado.

### 2.6 Detalle de combo (`app/combos/[id]/page.tsx`)

- **Problema:** `'use client'` + `useParams()` + `fetch(`/api/combos/${params.id}`)` en `useEffect`.
- **Ideal:** Server Component que reciba `params: Promise<{ id: string }>`, cargue el combo en servidor y pase datos a un Client Component solo para toggle estado y acciones.

### 2.7 Otras páginas con fetch en cliente

- **app/empleados/page.tsx** – fetch en cliente.
- **app/caja/page.tsx** – fetch en cliente.
- **app/config/page.tsx** – fetch en cliente.
- **app/catalogo/page.tsx** – fetch en cliente.
- **app/resumen/page.tsx** – fetch en cliente.

En todas, la **carga inicial** debería hacerse en Server Component (o en un Server Component padre que pase datos); solo la interactividad (formularios, filtros, botones) en Client Components.

---

## 3. Uso de `params` en App Router (Next.js 15)

El skill y la documentación actual indican que en las **páginas** (no en API routes) `params` es una **Promise** en Next.js 15.

- **app/combos/[id]/edit/page.tsx:** ✅ Usa `params: Promise<{ id: string }>` y `use(params)` correctamente (aunque la página sea `'use client'`).
- **app/products/[id]/page.tsx:** ⚠️ Usa `useParams()` (cliente). Válido, pero si se convierte a Server Component, la firma debe ser `params: Promise<{ id: string }>` y `const { id } = await params`.
- **app/combos/[id]/page.tsx:** Usa `useParams()` en cliente; si se migra a Server Component, usar `params` como Promise.

En **Route Handlers** (`app/api/...`) el proyecto ya usa `params: Promise<{ id: string }>` y `await params` en varios sitios (employees, cash-register, config); eso está alineado con el patrón.

---

## 4. Metadata y SEO

- **app/layout.tsx:** ✅ Tiene `export const metadata`.
- **Rutas dinámicas:** ❌ No hay `generateMetadata` en:
  - `app/products/[id]/page.tsx` (título/descripción por producto).
  - `app/combos/[id]/page.tsx`.
  - `app/sales/[id]/page.tsx`.

**Según el skill (Pattern 8):** Las páginas dinámicas deberían exponer `generateMetadata({ params })` para título, descripción y opcionalmente Open Graph/Twitter.

---

## 5. Server Actions

- **Estado:** No se usan Server Actions (`"use server"`). Las mutaciones se hacen con `fetch()` a API routes desde Client Components.
- **Recomendación del skill:** Usar Server Actions para mutaciones (crear/editar/eliminar categorías, productos, combos, ventas, etc.) con `revalidateTag` / `revalidatePath` y menos código cliente. Las API routes pueden seguir existiendo para uso externo o móvil si aplica.

---

## 6. Streaming y Suspense

- **app/loading.tsx:** ✅ Existe un loading global.
- **Por ruta:** No hay `loading.tsx` en rutas como `/sales`, `/products`, `/categories`, `/combos`, `/stock`, etc., por lo que no se aprovecha el streaming por segmento.
- **app/stock/page.tsx:** ✅ Usa `<Suspense>` con `StockPageContent` y un fallback; buen patrón. El resto de la página sigue siendo cliente con fetch en `useEffect`.

Recomendación: Añadir `loading.tsx` en las rutas que cargan datos (sales, products, categories, combos, stock, empleados, caja, config) para que Next muestre el fallback mientras resuelve el Server Component.

---

## 7. Estructura de componentes

- **Componentes en `app/components/`:** Navbar, PageHeader, ProductsList, SalesList, etc. Está bien para componentes ligados a la app.
- **Componentes UI en `components/ui/`:** Correcto.
- **Patrón recomendado:** Páginas como Server Components que importen datos en servidor y pasen “initial data” a Client Components (listas, formularios, botones). Así se evita fetch en cliente para la carga inicial.

---

## 8. Resumen de prioridades

| Prioridad | Acción |
|-----------|--------|
| Alta | Añadir `app/error.tsx` y `app/not-found.tsx`. |
| Alta | Convertir dashboard (`app/page.tsx`) a Server Component usando `getDashboardStats()` y sesión en servidor; client solo para links/interactividad. |
| Alta | Convertir `app/sales/page.tsx` a Server Component + `getSales(searchParams)`; client para filtros y eliminación. |
| Alta | Convertir `app/products/[id]/page.tsx` a Server Component con `getProductById`, `notFound()` y `generateMetadata`. |
| Media | Añadir `loading.tsx` en rutas principales (sales, products, categories, combos, stock). |
| Media | Convertir categorías, combos (lista y detalle), empleados, caja, config, catalogo, resumen a patrón Server Component + datos iniciales + Client Components para acciones. |
| Media | Añadir `generateMetadata` en productos/[id], combos/[id], sales/[id]. |
| Baja | Introducir Server Actions para mutaciones y usar `revalidateTag`/`revalidatePath`. |
| Baja | Unificar uso de `params` como Promise en todas las páginas dinámicas cuando sean Server Components. |

---

*Documento generado a partir del skill `.agents/skills/nextjs-app-router-patterns`.*
