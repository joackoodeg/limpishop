import { db } from '@/lib/db';
import { employees, storeConfig } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import type { EnabledModules } from '@/lib/types/config';

export interface ActiveEmployee {
  id: number;
  name: string;
  role: string;
}

export interface Employee {
  id: number;
  name: string;
  username: string;
  role: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
}

/**
 * Check if Empleados module is enabled (server-side)
 */
export async function isEmpleadosEnabled(): Promise<boolean> {
  try {
    const [config] = await db.select().from(storeConfig).limit(1);
    if (!config?.enabledModules) return false;
    const modules = JSON.parse(config.enabledModules) as EnabledModules;
    return modules.empleados === true;
  } catch {
    return false;
  }
}

/**
 * Fetch all employees without passwords (server-side)
 */
export async function getEmployees(): Promise<Employee[]> {
  try {
    const rows = await db
      .select({
        id: employees.id,
        name: employees.name,
        username: employees.username,
        role: employees.role,
        phone: employees.phone,
        email: employees.email,
        active: employees.active,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .orderBy(desc(employees.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      role: r.role,
      phone: r.phone ?? '',
      email: r.email ?? '',
      active: r.active,
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

/**
 * Fetch active employees for POS employee selector (server-side)
 */
export async function getActiveEmployees(): Promise<ActiveEmployee[]> {
  try {
    const rows = await db
      .select({ id: employees.id, name: employees.name, role: employees.role })
      .from(employees)
      .where(eq(employees.active, true))
      .orderBy(asc(employees.name));
    return rows as ActiveEmployee[];
  } catch (error) {
    console.error('Error fetching active employees:', error);
    return [];
  }
}
