import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cashMovements, cashRegisters } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - Listar movimientos de una caja
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const registerId = parseInt(id);

    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.cashRegisterId, registerId))
      .orderBy(desc(cashMovements.createdAt));

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching cash movements:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

// POST - Registrar un movimiento manual (ingreso/egreso)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const registerId = parseInt(id);

    // Verify register is open
    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.id, registerId));

    if (!register) {
      return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
    }
    if (register.status === 'closed') {
      return NextResponse.json({ error: 'No se pueden agregar movimientos a una caja cerrada' }, { status: 400 });
    }

    const body = await request.json();
    const { type, amount, description = '', category = 'otro' } = body;

    if (!type || !amount) {
      return NextResponse.json({ error: 'Tipo y monto son obligatorios' }, { status: 400 });
    }

    if (!['ingreso', 'egreso'].includes(type)) {
      return NextResponse.json({ error: 'Tipo debe ser ingreso o egreso' }, { status: 400 });
    }

    const [movement] = await db
      .insert(cashMovements)
      .values({
        cashRegisterId: registerId,
        type,
        amount: Math.abs(Number(amount)),
        description,
        category,
      })
      .returning();

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Error creating cash movement:', error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}
