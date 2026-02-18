import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Obtener proveedor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, parseInt(id)));

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Error al obtener proveedor' }, { status: 500 });
  }
}

// PUT - Actualizar proveedor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, contactName, phone, email, address, city, taxId, notes, active } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
      }
      // Check uniqueness
      const existing = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.name, name.trim()))
        .limit(1);
      if (existing.length > 0 && existing[0].id !== parseInt(id)) {
        return NextResponse.json({ error: 'Ya existe un proveedor con ese nombre' }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (contactName !== undefined) updateData.contactName = contactName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (notes !== undefined) updateData.notes = notes;
    if (active !== undefined) updateData.active = active;

    const [updated] = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
  }
}

// DELETE - Eliminar proveedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}
