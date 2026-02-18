import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/server-api';
import EditProductForm from './EditProductForm';
import type { ProductForEdit } from './EditProductForm';

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

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/products/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const product = await res.json();

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
  };

  return <EditProductForm id={id} initialProduct={initialProduct} />;
}
