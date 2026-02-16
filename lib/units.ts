export type ProductUnit = 'unidad' | 'kilo' | 'litro';

export const UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kilo', label: 'Kilo (kg)' },
  { value: 'litro', label: 'Litro (L)' },
];

/** Short unit abbreviation: "uds", "kg", "L" */
export function getUnitShort(unit: string): string {
  switch (unit) {
    case 'kilo': return 'kg';
    case 'litro': return 'L';
    default: return 'uds';
  }
}

/** Full unit name, singular or plural */
export function getUnitLabel(unit: string, quantity?: number): string {
  const q = quantity ?? 2; // default plural
  switch (unit) {
    case 'kilo': return q === 1 ? 'kilo' : 'kilos';
    case 'litro': return q === 1 ? 'litro' : 'litros';
    default: return q === 1 ? 'unidad' : 'unidades';
  }
}

/** Format a quantity respecting unit precision */
export function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'unidad') return String(Math.round(quantity));
  return quantity % 1 === 0 ? String(quantity) : quantity.toFixed(2);
}

/** Format stock with unit abbreviation, e.g. "15 uds" or "2.50 kg" */
export function formatStock(stock: number, unit: string): string {
  return `${formatQuantity(stock, unit)} ${getUnitShort(unit)}`;
}

/** Input step attribute based on unit */
export function getStockStep(unit: string): string {
  return unit === 'unidad' ? '1' : '0.01';
}

/** Low stock threshold per unit type */
export function getLowStockThreshold(unit: string): number {
  return unit === 'unidad' ? 5 : 2;
}
