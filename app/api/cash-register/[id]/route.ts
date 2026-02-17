import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cashRegisters, cashMovements } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

// GET - Obtener detalle de una caja
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const registerId = parseInt(id);

    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.id, registerId));

    if (!register) {
      return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
    }

    // Get all movements for this register
    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.cashRegisterId, registerId))
      .orderBy(cashMovements.createdAt);

    // Calculate totals
    const totalIngresos = movements
      .filter(m => m.type === 'ingreso' || m.type === 'venta')
      .reduce((sum, m) => sum + m.amount, 0);
    const totalEgresos = movements
      .filter(m => m.type === 'egreso')
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);
    const expected = register.openingAmount + totalIngresos - totalEgresos;

    return NextResponse.json({
      ...register,
      movements,
      totalIngresos,
      totalEgresos,
      calculatedExpected: expected,
    });
  } catch (error) {
    console.error('Error fetching cash register:', error);
    return NextResponse.json({ error: 'Error al obtener caja' }, { status: 500 });
  }
}

// PUT - Cerrar una caja
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const registerId = parseInt(id);
    const body = await request.json();
    const { closingAmount, note } = body;

    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.id, registerId));

    if (!register) {
      return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
    }

    if (register.status === 'closed') {
      return NextResponse.json({ error: 'Esta caja ya está cerrada' }, { status: 400 });
    }

    // Calculate expected amount
    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.cashRegisterId, registerId));

    const totalIngresos = movements
      .filter(m => m.type === 'ingreso' || m.type === 'venta')
      .reduce((sum, m) => sum + m.amount, 0);
    const totalEgresos = movements
      .filter(m => m.type === 'egreso')
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    const expectedAmount = register.openingAmount + totalIngresos - totalEgresos;
    const closing = Number(closingAmount);
    const difference = closing - expectedAmount;

    const [updated] = await db
      .update(cashRegisters)
      .set({
        closedAt: new Date().toISOString(),
        closingAmount: closing,
        expectedAmount,
        difference,
        status: 'closed',
        note: note || register.note,
      })
      .where(eq(cashRegisters.id, registerId))
      .returning();

    return NextResponse.json({ ...updated, totalIngresos, totalEgresos });
  } catch (error) {
    console.error('Error closing cash register:', error);
    return NextResponse.json({ error: 'Error al cerrar caja' }, { status: 500 });
  }
}
