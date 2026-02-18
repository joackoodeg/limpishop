import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers, storeConfig } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

// Helper: check if proveedores module is enabled
async function isProveedoresEnabled(): Promise<boolean> {
  const config = await db.select().from(storeConfig).limit(1);
  if (config.length === 0) return false;
  try {
    const modules = JSON.parse(config[0].enabledModules || '{}');
    return modules.proveedores === true;
  } catch {
    return false;
  }
}

// GET - Listar proveedores
export async function GET() {
  try {
    if (!(await isProveedoresEnabled())) {
      return NextResponse.json({ error: 'Módulo Proveedores no está habilitado' }, { status: 403 });
    }

    const allSuppliers = await db
      .select()
      .from(suppliers)
      .orderBy(asc(suppliers.name));

    return NextResponse.json(allSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

// POST - Crear proveedor
export async function POST(request: NextRequest) {
  try {
    if (!(await isProveedoresEnabled())) {
      return NextResponse.json({ error: 'Módulo Proveedores no está habilitado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, contactName = '', phone = '', email = '', address = '', city = '', taxId = '', notes = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Check if name already exists
    const existing = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.name, name.trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe un proveedor con ese nombre' }, { status: 400 });
    }

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        name: name.trim(),
        contactName,
        phone,
        email,
        address,
        city,
        taxId,
        notes,
      })
      .returning();

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
