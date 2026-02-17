import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';

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

    // Don't return the password
    const { password, ...employeeWithoutPassword } = employee;

    return NextResponse.json(employeeWithoutPassword);
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
    const { name, username, password, role, phone, email, active } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) {
      // Check if username is already taken by another employee
      const existing = await db
        .select()
        .from(employees)
        .where(eq(employees.username, username.trim()))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== parseInt(id)) {
        return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
      }
      updateData.username = username.trim();
    }
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }
      updateData.password = await hashPassword(password);
    }
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (active !== undefined) updateData.active = active;

    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Don't return the password
    const { password: _, ...employeeWithoutPassword } = updated;

    return NextResponse.json(employeeWithoutPassword);
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
