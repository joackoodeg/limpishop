import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees, storeConfig } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

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

    return NextResponse.json(allEmployees);
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
    const { name, role = 'vendedor', phone = '', email = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const [newEmployee] = await db
      .insert(employees)
      .values({
        name: name.trim(),
        role,
        phone,
        email,
      })
      .returning();

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 });
  }
}
