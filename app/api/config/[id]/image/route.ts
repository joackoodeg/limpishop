import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storeConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = parseInt(params.id);
    
    // Verificar que existe la configuración
    const existingConfig = await db
      .select()
      .from(storeConfig)
      .where(eq(storeConfig.id, configId));

    if (existingConfig.length === 0) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    // Eliminar imagen anterior si existe
    if (existingConfig[0].logoPublicId) {
      await deleteFromCloudinary(existingConfig[0].logoPublicId);
    }

    // Subir nueva imagen a Cloudinary
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'limpishop/config',
      transformation: [
        { width: 400, height: 400, crop: 'limit' }
      ]
    });

    // Actualizar en la base de datos
    const [updated] = await db
      .update(storeConfig)
      .set({
        logoUrl: uploadResult.secure_url,
        logoPublicId: uploadResult.public_id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(storeConfig.id, configId))
      .returning();

    return NextResponse.json({
      imageUrl: updated.logoUrl,
      imagePublicId: updated.logoPublicId,
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Error al subir el logo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = parseInt(params.id);

    // Obtener configuración actual
    const existingConfig = await db
      .select()
      .from(storeConfig)
      .where(eq(storeConfig.id, configId));

    if (existingConfig.length === 0) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar de Cloudinary
    if (existingConfig[0].logoPublicId) {
      await deleteFromCloudinary(existingConfig[0].logoPublicId);
    }

    // Actualizar en la base de datos
    await db
      .update(storeConfig)
      .set({
        logoUrl: null,
        logoPublicId: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(storeConfig.id, configId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el logo' },
      { status: 500 }
    );
  }
}
