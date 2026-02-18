import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/server-api';
import EditComboForm from './EditComboForm';
import type { InitialCombo } from './EditComboForm';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/combos/${id}`, { cache: 'no-store' });
  if (!res.ok) return { title: 'Editar Combo' };
  const combo = await res.json();
  return {
    title: `Editar: ${combo.name ?? 'Combo'}`,
    description: `Editar combo ${combo.name ?? id}.`,
  };
}

export default async function EditComboPage({ params }: Props) {
  const { id } = await params;
  const base = await getBaseUrl();

  const [comboRes, productsRes] = await Promise.all([
    fetch(`${base}/api/combos/${id}`, { cache: 'no-store' }),
    fetch(`${base}/api/products`, { cache: 'no-store' }),
  ]);

  if (!comboRes.ok) notFound();
  const combo = await comboRes.json();
  const products = productsRes.ok ? await productsRes.json() : [];

  const initialCombo: InitialCombo = {
    name: combo.name || '',
    description: combo.description || '',
    discountPercentage: combo.discountPercentage || 0,
    finalPrice: combo.finalPrice || 0,
    active: combo.active ?? true,
    products: (combo.products || []).map((p: { productId: number; productName?: string; quantity: number; price: number }) => ({
      productId: p.productId,
      productName: p.productName || 'Producto',
      quantity: p.quantity,
      price: p.price || 0,
    })),
  };

  return <EditComboForm id={id} initialCombo={initialCombo} products={products} />;
}
