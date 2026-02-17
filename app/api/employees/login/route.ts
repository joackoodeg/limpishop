import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees, storeConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';

// Helper: check if employees module is enabled
async function isEmpleadosEnabled(): Promise<boolean> {
  const config = await db.select().from(storeConfig).limit(1);
  if (config.length === 0) return false;
  try {
    const modules = JSON.parse(config[0].enabledModules || '{}');
    return modules.empleados === true;
  } catch {
    return false;
  }
}

// POST - Login empleado
export async function POST(request: NextRequest) {
  try {
    if (!(await isEmpleadosEnabled())) {
      return NextResponse.json({ error: 'Módulo Empleados no está habilitado' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 });
    }

    // Find employee by username
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.username, username.trim()))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    // Check if employee is active
    if (!employee.active) {
      return NextResponse.json({ error: 'Empleado inactivo' }, { status: 401 });
    }

    // Verify password
    const isValid = await verifyPassword(password, employee.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    // Don't return the password
    const { password: _, ...employeeWithoutPassword } = employee;

    return NextResponse.json({
      success: true,
      employee: employeeWithoutPassword,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
