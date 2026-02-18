import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supplierPayments, suppliers, cashRegisters, cashMovements, storeConfig } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - Obtener pagos de un proveedor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(supplierPayments)
      .where(eq(supplierPayments.supplierId, parseInt(id)))
      .orderBy(desc(supplierPayments.date));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    return NextResponse.json({ error: 'Error al obtener pagos del proveedor' }, { status: 500 });
  }
}

// POST - Registrar pago a proveedor (con integración a Caja Diaria)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supplierId = parseInt(id);
    const body = await request.json();
    const { amount, paymentMethod, date, note = '', registerInCaja = true } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'El método de pago es obligatorio' }, { status: 400 });
    }

    // Get supplier name for description
    const [supplier] = await db
      .select({ name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    let cashRegisterId: number | null = null;
    let cashMovementId: number | null = null;

    // Integration with Caja Diaria: create egreso if caja is open and requested
    if (registerInCaja) {
      // Check if cajaDiaria module is enabled
      const [config] = await db.select().from(storeConfig).limit(1);
      let cajaEnabled = false;
      if (config?.enabledModules) {
        try {
          const modules = JSON.parse(config.enabledModules);
          cajaEnabled = modules.cajaDiaria === true;
        } catch {
          /* ignore */
        }
      }

      if (cajaEnabled) {
        // Find open cash register
        const [openRegister] = await db
          .select()
          .from(cashRegisters)
          .where(eq(cashRegisters.status, 'open'))
          .limit(1);

        if (openRegister) {
          cashRegisterId = openRegister.id;

          // Create cash movement (egreso)
          const [movement] = await db
            .insert(cashMovements)
            .values({
              cashRegisterId: openRegister.id,
              type: 'egreso',
              amount,
              description: `Pago a proveedor: ${supplier.name}`,
              category: 'pago_proveedor',
            })
            .returning();

          cashMovementId = movement.id;
        }
      }
    }

    // Create the supplier payment
    const [payment] = await db
      .insert(supplierPayments)
      .values({
        supplierId,
        amount,
        paymentMethod,
        date: date || new Date().toISOString(),
        note,
        cashRegisterId,
        cashMovementId,
      })
      .returning();

    // Update the cash movement's referenceId to link back to the payment
    if (cashMovementId) {
      await db
        .update(cashMovements)
        .set({ referenceId: payment.id })
        .where(eq(cashMovements.id, cashMovementId));
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier payment:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}
