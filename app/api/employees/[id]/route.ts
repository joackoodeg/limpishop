import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Obtener empleado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(id)));

    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Error al obtener empleado' }, { status: 500 });
  }
}

// PUT - Actualizar empleado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, phone, email, active } = body;

    const [updated] = await db
      .update(employees)
      .set({
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(active !== undefined && { active }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employees.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Error al actualizar empleado' }, { status: 500 });
  }
}

// DELETE - Eliminar empleado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(employees)
      .where(eq(employees.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Error al eliminar empleado' }, { status: 500 });
  }
}
