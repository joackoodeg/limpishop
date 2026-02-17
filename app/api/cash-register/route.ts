import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cashRegisters, cashMovements, storeConfig } from '@/lib/db/schema';
import { eq, desc, sql, and, sum } from 'drizzle-orm';

// Helper: check if caja module is enabled
async function isCajaEnabled(): Promise<boolean> {
  const config = await db.select().from(storeConfig).limit(1);
  if (config.length === 0) return false;
  try {
    const modules = JSON.parse(config[0].enabledModules || '{}');
    return modules.cajaDiaria === true;
  } catch {
    return false;
  }
}

// GET - Obtener caja actual (open) o historial
export async function GET(request: NextRequest) {
  try {
    if (!(await isCajaEnabled())) {
      return NextResponse.json({ error: 'Módulo Caja Diaria no está habilitado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'open' | 'closed' | null (all)

    let query = db.select().from(cashRegisters).orderBy(desc(cashRegisters.openedAt));

    let results;
    if (status === 'open') {
      results = await query.where(eq(cashRegisters.status, 'open'));
    } else if (status === 'closed') {
      results = await query.where(eq(cashRegisters.status, 'closed'));
    } else {
      results = await query;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching cash registers:', error);
    return NextResponse.json({ error: 'Error al obtener cajas' }, { status: 500 });
  }
}

// POST - Abrir una nueva caja
export async function POST(request: NextRequest) {
  try {
    if (!(await isCajaEnabled())) {
      return NextResponse.json({ error: 'Módulo Caja Diaria no está habilitado' }, { status: 403 });
    }

    // Check there's no already open register
    const openRegisters = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.status, 'open'));

    if (openRegisters.length > 0) {
      return NextResponse.json(
        { error: 'Ya hay una caja abierta. Cerrala antes de abrir una nueva.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { openingAmount = 0, note = '' } = body;

    const [newRegister] = await db
      .insert(cashRegisters)
      .values({
        openingAmount: Number(openingAmount),
        note,
        status: 'open',
      })
      .returning();

    return NextResponse.json(newRegister, { status: 201 });
  } catch (error) {
    console.error('Error opening cash register:', error);
    return NextResponse.json({ error: 'Error al abrir caja' }, { status: 500 });
  }
}
