import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como precio en formato argentino.
 * Separador de miles: punto. Sin centavos.
 * Ej: 1.000, 10.000, 100.000
 */
export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString('es-AR')}`
}
