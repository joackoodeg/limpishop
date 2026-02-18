# Auditoría: shadcn/ui + Tailwind v4

Auditoría realizada según [.agents/skills/tailwind-v4-shadcn](.agents/skills/tailwind-v4-shadcn).  
Fecha: 2026-02-17.

---

## Resumen ejecutivo

| Área              | Estado   | Acción recomendada                          |
|-------------------|----------|---------------------------------------------|
| CSS (globals.css) | Mejorable | Quitar `tailwindcss-animate`, revisar `@layer base` |
| components.json  | Mejorable | `config: ""` para v4                        |
| tailwind.config.js| Opcional | Eliminar o dejar mínimo (v4 tema en CSS)    |
| Dependencias      | Mejorable | Quitar `tailwindcss-animate`                |
| Tema / dark mode  | Opcional | Añadir ThemeProvider si se quiere toggle    |

---

## 1. `app/globals.css`

### 1.1 Doble sistema de animaciones (Error #1 del skill)

**Situación:** Se usan a la vez el plugin v3 y la librería v4:

```css
@plugin "tailwindcss-animate";   /* ❌ v3 – deprecado para shadcn en v4 */
@import "tw-animate-css";        /* ✅ v4 – requerido para shadcn */
```

**Recomendación:** Quitar `@plugin "tailwindcss-animate"` y dejar solo `tw-animate-css` para evitar conflictos y seguir la guía de shadcn para Tailwind v4.

---

### 1.2 Variables y `@theme inline`

**Situación:**

- `:root` y `.dark` están a nivel raíz (no dentro de `@layer base`) ✅  
- Colores en OKLCH ✅ (recomendado en v4)  
- `@theme inline` mapea todas las variables semánticas ✅  

No hay cambios obligatorios aquí.

---

### 1.3 `@layer base` y `@apply` (Errores #7 y #8 del skill)

**Situación actual:**

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

En Tailwind v4, `@apply` solo puede usar clases definidas con `@utility`. Las clases como `border-border`, `bg-background`, etc. son utilidades generadas por `@theme inline`, por lo que en principio siguen siendo válidas para `@apply`. El riesgo que documenta el skill es:

- **#8:** Los estilos en `@layer base` pueden quedar por debajo de la capa de utilidades y verse sobrescritos.

**Recomendación (opcional, más robusta):** Definir estilos de base sin `@layer base` para evitar problemas de orden de capas:

```css
* {
  border-color: var(--border);
  outline-color: var(--ring);
  outline-offset: 2px;
}
body {
  background-color: var(--background);
  color: var(--foreground);
}
```

Si se mantiene `@layer base`, conviene verificar en navegador que `body` y los bordes se ven correctamente en todos los temas.

---

### 1.4 Variante `dark`

**Situación:** `@custom-variant dark (&:is(.dark *));` está bien para dark mode basado en clase `.dark`.  
No es necesario cambiar nada si el modo oscuro se aplica con una clase en un ancestro (p. ej. `<html class="dark">`).

---

## 2. `components.json`

**Situación:**

```json
"tailwind": {
  "config": "tailwind.config.js",
  "css": "app/globals.css",
  "baseColor": "neutral",
  "cssVariables": true,
  "prefix": ""
}
```

Para Tailwind v4 el tema se define en CSS (`@theme inline` en `globals.css`), no en un archivo JS. El skill indica usar `"config": ""` para que la CLI de shadcn no espere un config de tema en JS.

**Recomendación:** Cambiar a:

```json
"tailwind": {
  "config": "",
  "css": "app/globals.css",
  "baseColor": "neutral",
  "cssVariables": true,
  "prefix": ""
}
```

---

## 3. `tailwind.config.js`

**Situación:** Existe un `tailwind.config.js` con `content` y `theme: { extend: {} }`. En v4 con PostCSS, el contenido se puede descubrir por defecto y el tema está en CSS.

**Recomendación:**  
- Si tras poner `"config": ""` en `components.json` el build y la CLI de shadcn funcionan bien, se puede **eliminar** `tailwind.config.js`.  
- Si en tu entorno Next + PostCSS sigue siendo necesario un archivo de config, déjalo mínimo (solo lo que Next/Tailwind exijan) y mantén el tema en `globals.css`.

---

## 4. Dependencias (`package.json`)

**Situación:**

- `tailwindcss-animate`: usado en v3; para shadcn en v4 se usa `tw-animate-css`.  
- `tw-animate-css`: ya está instalado ✅  

**Recomendación:** Quitar `tailwindcss-animate` y usar solo `tw-animate-css`:

```bash
npm uninstall tailwindcss-animate
```

Y en `globals.css`, quitar la línea `@plugin "tailwindcss-animate";` (ver punto 1.1).

---

## 5. ThemeProvider y dark mode

**Situación:** En `app/layout.tsx` no se usa `ThemeProvider` (ni `next-themes` ni un provider propio). El proyecto incluye `next-themes` en dependencias pero no está integrado en el layout.

**Recomendación (si quieres modo oscuro con toggle):**

1. Crear o reutilizar un `ThemeProvider` que ponga la clase `.dark` en `<html>` (p. ej. el de `next-themes`).
2. Envolver la app en `layout.tsx` con ese provider y usar `suppressHydrationWarning` en `<html>` si lo indica la doc de next-themes.

Los usos de `dark:` en la app (p. ej. `dark:bg-green-950/20`, `dark:text-emerald-400`) son para paletas concretas, no para variables semánticas; el skill solo desaconseja `dark:` para colores semánticos que ya cambian con el tema (p. ej. `bg-background`). No es necesario cambiar esas clases.

---

## 6. Componentes UI shadcn

Revisión rápida:

- **`components/ui/button.tsx`**: Usa variables semánticas (`bg-primary`, `text-primary-foreground`, etc.) y `cn()` ✅  
- **`components/ui/card.tsx`**: `bg-card`, `text-card-foreground` ✅  
- **`lib/utils.ts`**: Función `cn()` con `clsx` + `tailwind-merge` ✅  

No se detectan usos incorrectos de `dark:` para semánticos ni doble wrap `hsl(var(...))` en los componentes revisados.

---

## Checklist del skill (resumen)

| Punto del skill                         | Estado en el proyecto        |
|----------------------------------------|------------------------------|
| `@tailwindcss/postcss` (Next)          | ✅ postcss.config.js         |
| `components.json` → `"config": ""`     | ❌ → poner `""`              |
| Sin `tailwind.config.js` o mínimo      | ⚠️ Opcional eliminarlo       |
| 4 pasos en CSS (variables, @theme, base)| ✅ Solo ajustar animaciones y base |
| Una sola animación: `tw-animate-css`   | ❌ → quitar tailwindcss-animate |
| ThemeProvider si hay dark mode         | ⚠️ Opcional si quieres toggle |
| Evitar `@layer base` problemático      | ⚠️ Valorar estilos sin @layer base |

---

## Plan de acción sugerido

1. **Prioridad alta**  
   - En `globals.css`: quitar `@plugin "tailwindcss-animate";`.  
   - En `package.json`: desinstalar `tailwindcss-animate`.

2. **Prioridad media**  
   - En `components.json`: poner `"config": ""` en `tailwind.config`.  
   - Comprobar build y que las animaciones de shadcn (diálogos, selects, etc.) siguen funcionando.

3. **Prioridad baja / opcional**  
   - Eliminar `tailwind.config.js` si el build no lo requiere.  
   - Sustituir estilos de `@layer base` por reglas sin `@layer` (ver 1.3) si se observan sobrescrituras.  
   - Integrar ThemeProvider (p. ej. next-themes) en el layout si se quiere un toggle de modo oscuro.

Si quieres, el siguiente paso puede ser aplicar solo los cambios de prioridad alta en los archivos concretos (parches en `globals.css`, `components.json` y `package.json`).
