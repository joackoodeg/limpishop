import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supplierProducts, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Obtener productos asociados a un proveedor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(supplierProducts)
      .where(eq(supplierProducts.supplierId, parseInt(id)));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    return NextResponse.json({ error: 'Error al obtener productos del proveedor' }, { status: 500 });
  }
}

// POST - Asociar producto a proveedor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supplierId = parseInt(id);
    const body = await request.json();
    const { productId, cost } = body;

    if (!productId) {
      return NextResponse.json({ error: 'El producto es obligatorio' }, { status: 400 });
    }

    // Check if already associated
    const existing = await db
      .select()
      .from(supplierProducts)
      .where(
        and(
          eq(supplierProducts.supplierId, supplierId),
          eq(supplierProducts.productId, productId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Este producto ya está asociado al proveedor' }, { status: 400 });
    }

    // Get product name
    const [product] = await db
      .select({ name: products.name })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const [created] = await db
      .insert(supplierProducts)
      .values({
        supplierId,
        productId,
        productName: product.name,
        cost: cost ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error associating product to supplier:', error);
    return NextResponse.json({ error: 'Error al asociar producto' }, { status: 500 });
  }
}

// DELETE - Desasociar producto de proveedor (by supplierProduct ID via query param)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const url = new URL(request.url);
    const spId = url.searchParams.get('spId');

    if (!spId) {
      return NextResponse.json({ error: 'Se requiere el ID de la asociación (spId)' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(supplierProducts)
      .where(eq(supplierProducts.id, parseInt(spId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Asociación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing supplier product:', error);
    return NextResponse.json({ error: 'Error al desasociar producto' }, { status: 500 });
  }
}
