import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/server-api';
import EditProductForm from './EditProductForm';
import type { ProductForEdit } from './EditProductForm';
import { db } from '@/lib/db';
import { supplierProducts, storeConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/products/${id}`, { cache: 'no-store' });
  if (!res.ok) return { title: 'Editar Producto' };
  const product = await res.json();
  return {
    title: `Editar: ${product.name ?? 'Producto'}`,
    description: `Editar producto ${product.name ?? id}.`,
  };
}

async function isProveedoresEnabled(): Promise<boolean> {
  try {
    const config = await db.select().from(storeConfig).limit(1);
    if (config.length === 0) return false;
    const modules = JSON.parse(config[0].enabledModules || '{}');
    return modules.proveedores === true;
  } catch {
    return false;
  }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/products/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const product = await res.json();

  // Fetch current supplier association if module is enabled
  let supplierId: number | null = null;
  if (await isProveedoresEnabled()) {
    const [sp] = await db.select().from(supplierProducts).where(eq(supplierProducts.productId, Number(id)));
    supplierId = sp?.supplierId ?? null;
  }

  const initialProduct: ProductForEdit = {
    id: product.id,
    name: product.name,
    prices: product.prices ?? [],
    cost: product.cost,
    stock: product.stock,
    description: product.description,
    unit: product.unit || 'unidad',
    active: product.active,
    featured: product.featured,
    categoryId: product.categoryId ?? null,
    supplierId,
  };

  return <EditProductForm id={id} initialProduct={initialProduct} />;
}
