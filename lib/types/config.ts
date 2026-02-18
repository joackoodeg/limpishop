// Shared types for store configuration
import type { CustomUnit } from '@/lib/units';

export interface EnabledModules {
  cajaDiaria: boolean;
  empleados: boolean;
  proveedores: boolean;
}

export interface StoreConfig {
  id: number;
  storeName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  taxId: string;
  enabledModules: EnabledModules;
  allowedUnits: string[];
  customUnits: CustomUnit[];
}

export const DEFAULT_ENABLED_MODULES: EnabledModules = {
  cajaDiaria: false,
  empleados: false,
  proveedores: false,
};

export const DEFAULT_ALLOWED_UNITS = ['unidad', 'kilo', 'litro'];
