import { db } from '@/lib/db';
import { cashRegisters, cashMovements, storeConfig } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { EnabledModules } from '@/lib/types/config';

export interface CashRegister {
  id: number;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  note: string;
}

export interface CashMovement {
  id: number;
  cashRegisterId: number;
  type: 'ingreso' | 'egreso' | 'venta';
  amount: number;
  description: string;
  category: string;
  referenceId: number | null;
  createdAt: string;
}

export interface CashRegisterDetail extends CashRegister {
  movements: CashMovement[];
  totalIngresos: number;
  totalEgresos: number;
  calculatedExpected: number;
}

/**
 * Check if Caja Diaria module is enabled (server-side)
 */
export async function isCajaEnabled(): Promise<boolean> {
  try {
    const [config] = await db.select().from(storeConfig).limit(1);
    if (!config?.enabledModules) return false;
    const modules = JSON.parse(config.enabledModules) as EnabledModules;
    return modules.cajaDiaria === true;
  } catch {
    return false;
  }
}

/**
 * Get the currently open cash register with movements and totals (or null)
 */
export async function getOpenRegister(): Promise<CashRegisterDetail | null> {
  try {
    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.status, 'open'))
      .limit(1);

    if (!register) return null;

    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.cashRegisterId, register.id))
      .orderBy(asc(cashMovements.createdAt));

    const totalIngresos = movements
      .filter((m) => m.type === 'ingreso' || m.type === 'venta')
      .reduce((sum, m) => sum + m.amount, 0);
    const totalEgresos = movements
      .filter((m) => m.type === 'egreso')
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);
    const calculatedExpected = register.openingAmount + totalIngresos - totalEgresos;

    return {
      id: register.id,
      openedAt: register.openedAt,
      closedAt: register.closedAt,
      openingAmount: register.openingAmount,
      closingAmount: register.closingAmount,
      expectedAmount: register.expectedAmount,
      difference: register.difference,
      status: register.status as 'open' | 'closed',
      note: register.note ?? '',
      movements: movements.map((m) => ({
        id: m.id,
        cashRegisterId: m.cashRegisterId,
        type: m.type as 'ingreso' | 'egreso' | 'venta',
        amount: m.amount,
        description: m.description ?? '',
        category: m.category,
        referenceId: m.referenceId,
        createdAt: m.createdAt,
      })),
      totalIngresos,
      totalEgresos,
      calculatedExpected,
    };
  } catch (error) {
    console.error('Error fetching open cash register:', error);
    return null;
  }
}

/**
 * Get a single cash register by id (open or closed) with movements and totals
 */
export async function getRegisterById(id: number): Promise<CashRegisterDetail | null> {
  try {
    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.id, id));

    if (!register) return null;

    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.cashRegisterId, register.id))
      .orderBy(asc(cashMovements.createdAt));

    const totalIngresos = movements
      .filter((m) => m.type === 'ingreso' || m.type === 'venta')
      .reduce((sum, m) => sum + m.amount, 0);
    const totalEgresos = movements
      .filter((m) => m.type === 'egreso')
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);
    const calculatedExpected = register.openingAmount + totalIngresos - totalEgresos;

    return {
      id: register.id,
      openedAt: register.openedAt,
      closedAt: register.closedAt,
      openingAmount: register.openingAmount,
      closingAmount: register.closingAmount,
      expectedAmount: register.expectedAmount,
      difference: register.difference,
      status: register.status as 'open' | 'closed',
      note: register.note ?? '',
      movements: movements.map((m) => ({
        id: m.id,
        cashRegisterId: m.cashRegisterId,
        type: m.type as 'ingreso' | 'egreso' | 'venta',
        amount: m.amount,
        description: m.description ?? '',
        category: m.category,
        referenceId: m.referenceId,
        createdAt: m.createdAt,
      })),
      totalIngresos,
      totalEgresos,
      calculatedExpected,
    };
  } catch (error) {
    console.error('Error fetching cash register by id:', error);
    return null;
  }
}

/**
 * Get closed cash registers for history (most recent first)
 */
export async function getClosedRegisters(): Promise<CashRegister[]> {
  try {
    const rows = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.status, 'closed'))
      .orderBy(desc(cashRegisters.closedAt));

    return rows.map((r) => ({
      id: r.id,
      openedAt: r.openedAt,
      closedAt: r.closedAt,
      openingAmount: r.openingAmount,
      closingAmount: r.closingAmount,
      expectedAmount: r.expectedAmount,
      difference: r.difference,
      status: r.status as 'open' | 'closed',
      note: r.note ?? '',
    }));
  } catch (error) {
    console.error('Error fetching closed registers:', error);
    return [];
  }
}
