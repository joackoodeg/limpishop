import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees, storeConfig } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';

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

// GET - Listar empleados
export async function GET() {
  try {
    if (!(await isEmpleadosEnabled())) {
      return NextResponse.json({ error: 'Módulo Empleados no está habilitado' }, { status: 403 });
    }

    const allEmployees = await db
      .select()
      .from(employees)
      .orderBy(desc(employees.createdAt));

    // Remove passwords from response
    const employeesWithoutPasswords = allEmployees.map(({ password, ...employee }) => employee);

    return NextResponse.json(employeesWithoutPasswords);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 });
  }
}

// POST - Crear empleado
export async function POST(request: NextRequest) {
  try {
    if (!(await isEmpleadosEnabled())) {
      return NextResponse.json({ error: 'Módulo Empleados no está habilitado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password, role = 'vendedor', phone = '', email = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'El nombre de usuario es obligatorio' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Check if username already exists
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.username, username.trim()))
      .limit(1);

    if (existingEmployee.length > 0) {
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const [newEmployee] = await db
      .insert(employees)
      .values({
        name: name.trim(),
        username: username.trim(),
        password: hashedPassword,
        role,
        phone,
        email,
      })
      .returning();

    // Don't return the password in the response
    const { password: _, ...employeeWithoutPassword } = newEmployee;

    return NextResponse.json(employeeWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 });
  }
}
