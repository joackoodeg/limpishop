import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storeConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper to safely parse JSON fields from the DB row
function parseConfigRow(row: any) {
  return {
    ...row,
    enabledModules: safeJsonParse(row.enabledModules, { cajaDiaria: false, empleados: false }),
    allowedUnits: safeJsonParse(row.allowedUnits, ['unidad', 'kilo', 'litro']),
    customUnits: safeJsonParse(row.customUnits, []),
  };
}

function safeJsonParse(value: string | null | undefined, fallback: any) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// GET - Obtener configuración del local
export async function GET() {
  try {
    const config = await db.select().from(storeConfig).limit(1);
    
    if (config.length === 0) {
      // Si no existe configuración, crear una por defecto
      const [newConfig] = await db.insert(storeConfig).values({
        storeName: 'Mi Negocio',
        phone: '',
        email: '',
        address: '',
        city: '',
      }).returning();
      
      return NextResponse.json(parseConfigRow(newConfig));
    }
    
    return NextResponse.json(parseConfigRow(config[0]));
  } catch (error) {
    console.error('Error fetching store config:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración del local
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeName, phone, email, address, city,
      logoUrl, logoPublicId, taxId,
      enabledModules, allowedUnits, customUnits,
    } = body;

    // Obtener el ID de la configuración existente
    const existingConfig = await db.select().from(storeConfig).limit(1);
    
    if (existingConfig.length === 0) {
      // Si no existe, crear nueva configuración
      const [newConfig] = await db.insert(storeConfig).values({
        storeName: storeName || 'Mi Negocio',
        phone: phone || '',
        email: email || '',
        address: address || '',
        city: city || '',
        logoUrl: logoUrl || null,
        logoPublicId: logoPublicId || null,
        taxId: taxId || '',
        enabledModules: enabledModules ? JSON.stringify(enabledModules) : undefined,
        allowedUnits: allowedUnits ? JSON.stringify(allowedUnits) : undefined,
        customUnits: customUnits ? JSON.stringify(customUnits) : undefined,
      }).returning();
      
      return NextResponse.json(parseConfigRow(newConfig));
    }

    // Actualizar configuración existente
    const [updatedConfig] = await db
      .update(storeConfig)
      .set({
        storeName: storeName || existingConfig[0].storeName,
        phone: phone || '',
        email: email || '',
        address: address || '',
        city: city || '',
        logoUrl: logoUrl !== undefined ? logoUrl : existingConfig[0].logoUrl,
        logoPublicId: logoPublicId !== undefined ? logoPublicId : existingConfig[0].logoPublicId,
        taxId: taxId || '',
        enabledModules: enabledModules !== undefined
          ? JSON.stringify(enabledModules)
          : existingConfig[0].enabledModules,
        allowedUnits: allowedUnits !== undefined
          ? JSON.stringify(allowedUnits)
          : existingConfig[0].allowedUnits,
        customUnits: customUnits !== undefined
          ? JSON.stringify(customUnits)
          : existingConfig[0].customUnits,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(storeConfig.id, existingConfig[0].id))
      .returning();

    return NextResponse.json(parseConfigRow(updatedConfig));
  } catch (error) {
    console.error('Error updating store config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la configuración' },
      { status: 500 }
    );
  }
}
