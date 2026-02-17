'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { StoreConfig, EnabledModules } from '@/lib/types/config';
import type { CustomUnit } from '@/lib/units';

interface StoreConfigContextValue {
  config: StoreConfig | null;
  loading: boolean;
  /** Re-fetch config from the server */
  refresh: () => Promise<void>;
  /** Check if a module is enabled */
  isModuleEnabled: (module: keyof EnabledModules) => boolean;
  /** Get allowed unit IDs (built-in + custom) */
  allowedUnits: string[];
  /** Get custom units */
  customUnits: CustomUnit[];
}

const StoreConfigContext = createContext<StoreConfigContextValue>({
  config: null,
  loading: true,
  refresh: async () => {},
  isModuleEnabled: () => false,
  allowedUnits: ['unidad', 'kilo', 'litro'],
  customUnits: [],
});

export function useStoreConfig() {
  return useContext(StoreConfigContext);
}

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      const data: StoreConfig = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('StoreConfigProvider: error fetching config', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isModuleEnabled = useCallback(
    (module: keyof EnabledModules) => {
      return config?.enabledModules?.[module] ?? false;
    },
    [config],
  );

  const allowedUnits = config?.allowedUnits ?? ['unidad', 'kilo', 'litro'];
  const customUnits = config?.customUnits ?? [];

  return (
    <StoreConfigContext.Provider
      value={{ config, loading, refresh: fetchConfig, isModuleEnabled, allowedUnits, customUnits }}
    >
      {children}
    </StoreConfigContext.Provider>
  );
}
