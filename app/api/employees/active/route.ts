import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

// GET - Listar empleados activos (para selectores en ventas)
export async function GET() {
  try {
    const activeEmployees = await db
      .select({ id: employees.id, name: employees.name, role: employees.role })
      .from(employees)
      .where(eq(employees.active, true))
      .orderBy(asc(employees.name));

    return NextResponse.json(activeEmployees);
  } catch (error) {
    console.error('Error fetching active employees:', error);
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 });
  }
}
