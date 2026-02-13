import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storeConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
      
      return NextResponse.json(newConfig);
    }
    
    return NextResponse.json(config[0]);
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
    const { storeName, phone, email, address, city, logoUrl, logoPublicId, taxId } = body;

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
      }).returning();
      
      return NextResponse.json(newConfig);
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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(storeConfig.id, existingConfig[0].id))
      .returning();

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating store config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la configuración' },
      { status: 500 }
    );
  }
}
