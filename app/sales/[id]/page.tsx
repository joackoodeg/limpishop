import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/server-api';
import SaleDetailContent from './SaleDetailContent';
import { formatPrice } from '@/lib/utils';
import type { Sale } from '@/lib/data/sales';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/sales/${id}`, { cache: 'no-store' });
  if (!res.ok) return { title: `Venta #${id}` };
  const sale: Sale = await res.json();
  return {
    title: `Venta #${sale.id}`,
    description: `Detalle de venta del ${sale.date ? new Date(sale.date).toLocaleDateString() : ''} — ${formatPrice(sale.grandTotal ?? 0)}`,
  };
}

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params;
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/sales/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const sale: Sale = await res.json();

  return <SaleDetailContent sale={sale} />;
}
