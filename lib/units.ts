// ── Types ────────────────────────────────────────────────────────────────────
export type BuiltinUnit = 'unidad' | 'kilo' | 'litro';

export interface CustomUnit {
  id: string;       // unique slug, e.g. "docena"
  name: string;     // display name, e.g. "Docena"
  short: string;    // abbreviation, e.g. "doc"
  step: number;     // input step (1 for integer, 0.01 for decimal)
  lowStockThreshold: number;
}

export interface UnitOption {
  value: string;
  label: string;
}

// ── Built-in unit definitions ────────────────────────────────────────────────
const BUILTIN_UNITS: Record<BuiltinUnit, { label: string; short: string; singular: string; plural: string; step: number; lowStock: number }> = {
  unidad: { label: 'Unidad', short: 'uds', singular: 'unidad', plural: 'unidades', step: 1, lowStock: 5 },
  kilo:   { label: 'Kilo (kg)', short: 'kg', singular: 'kilo', plural: 'kilos', step: 0.01, lowStock: 2 },
  litro:  { label: 'Litro (L)', short: 'L', singular: 'litro', plural: 'litros', step: 0.01, lowStock: 2 },
};

/**
 * Legacy static export — always all 3 built-in options.
 * Prefer `getAvailableUnitOptions()` for config-aware code.
 */
export const UNIT_OPTIONS: UnitOption[] = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kilo', label: 'Kilo (kg)' },
  { value: 'litro', label: 'Litro (L)' },
];

// ── Config-aware helpers ─────────────────────────────────────────────────────

/**
 * Returns the list of unit options the business has enabled,
 * combining allowed built-in units + custom units.
 */
export function getAvailableUnitOptions(
  allowedUnits: string[] = ['unidad', 'kilo', 'litro'],
  customUnits: CustomUnit[] = [],
): UnitOption[] {
  const builtinOptions = allowedUnits
    .filter((u): u is BuiltinUnit => u in BUILTIN_UNITS)
    .map(u => ({ value: u, label: BUILTIN_UNITS[u].label }));

  const customOptions = customUnits.map(cu => ({
    value: cu.id,
    label: cu.name,
  }));

  return [...builtinOptions, ...customOptions];
}

// ── Unit property accessors (work for both built-in and custom) ──────────────

function findCustomUnit(unit: string, customUnits: CustomUnit[] = []): CustomUnit | undefined {
  return customUnits.find(cu => cu.id === unit);
}

/** Short unit abbreviation: "uds", "kg", "L", or custom short */
export function getUnitShort(unit: string, customUnits?: CustomUnit[]): string {
  if (unit in BUILTIN_UNITS) return BUILTIN_UNITS[unit as BuiltinUnit].short;
  const cu = findCustomUnit(unit, customUnits);
  return cu?.short ?? unit;
}

/** Full unit name, singular or plural */
export function getUnitLabel(unit: string, quantity?: number, customUnits?: CustomUnit[]): string {
  const q = quantity ?? 2; // default plural
  if (unit in BUILTIN_UNITS) {
    const b = BUILTIN_UNITS[unit as BuiltinUnit];
    return q === 1 ? b.singular : b.plural;
  }
  const cu = findCustomUnit(unit, customUnits);
  return cu?.name ?? unit;
}

/** Format a quantity respecting unit precision */
export function formatQuantity(quantity: number, unit: string, customUnits?: CustomUnit[]): string {
  if (unit in BUILTIN_UNITS) {
    if (unit === 'unidad') return String(Math.round(quantity));
    return quantity % 1 === 0 ? String(quantity) : quantity.toFixed(2);
  }
  const cu = findCustomUnit(unit, customUnits);
  if (cu && cu.step >= 1) return String(Math.round(quantity));
  return quantity % 1 === 0 ? String(quantity) : quantity.toFixed(2);
}

/** Format stock with unit abbreviation, e.g. "15 uds" or "2.50 kg" */
export function formatStock(stock: number, unit: string, customUnits?: CustomUnit[]): string {
  return `${formatQuantity(stock, unit, customUnits)} ${getUnitShort(unit, customUnits)}`;
}

/** Input step attribute based on unit */
export function getStockStep(unit: string, customUnits?: CustomUnit[]): string {
  if (unit in BUILTIN_UNITS) return String(BUILTIN_UNITS[unit as BuiltinUnit].step);
  const cu = findCustomUnit(unit, customUnits);
  return cu ? String(cu.step) : '1';
}

/** Low stock threshold per unit type */
export function getLowStockThreshold(unit: string, customUnits?: CustomUnit[]): number {
  if (unit in BUILTIN_UNITS) return BUILTIN_UNITS[unit as BuiltinUnit].lowStock;
  const cu = findCustomUnit(unit, customUnits);
  return cu?.lowStockThreshold ?? 5;
}
