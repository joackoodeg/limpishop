import { db } from '@/lib/db';
import { employees, storeConfig } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { EnabledModules } from '@/lib/types/config';

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
