import { db } from '@/lib/db';
import { storeConfig } from '@/lib/db/schema';
import type { StoreConfig, EnabledModules } from '@/lib/types/config';
import type { CustomUnit } from '@/lib/units';

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseConfigRow(row: {
  id: number;
  storeName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  taxId: string | null;
  enabledModules: string | null;
  allowedUnits: string | null;
  customUnits: string | null;
}): StoreConfig {
  return {
    id: row.id,
    storeName: row.storeName,
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    logoUrl: row.logoUrl,
    logoPublicId: row.logoPublicId,
    taxId: row.taxId ?? '',
    enabledModules: safeJsonParse<EnabledModules>(row.enabledModules, {
      cajaDiaria: false,
      empleados: false,
      proveedores: false,
    }),
    allowedUnits: safeJsonParse<string[]>(row.allowedUnits, [
      'unidad',
      'kilo',
      'litro',
    ]),
    customUnits: safeJsonParse<CustomUnit[]>(row.customUnits, []),
  };
}

/**
 * Get store configuration (server-side). Creates default if none exists.
 */
export async function getStoreConfig(): Promise<StoreConfig> {
  const config = await db.select().from(storeConfig).limit(1);

  if (config.length === 0) {
    const [newConfig] = await db
      .insert(storeConfig)
      .values({
        storeName: 'Mi Negocio',
        phone: '',
        email: '',
        address: '',
        city: '',
      })
      .returning();
    return parseConfigRow(newConfig);
  }

  return parseConfigRow(config[0]);
}
