import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getComboById } from '@/lib/data/combos';
import { ComboDetailContent } from '../../components/ComboDetailContent';

interface ComboPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ComboPageProps): Promise<Metadata> {
  const { id } = await params;
  const combo = await getComboById(Number(id));
  if (!combo) return { title: 'Combo no encontrado' };
  return {
    title: combo.name,
    description: combo.description ?? `Detalle del combo ${combo.name}`,
  };
}

export default async function ComboPage({ params }: ComboPageProps) {
  const { id } = await params;
  const comboId = Number(id);
  if (isNaN(comboId)) notFound();

  const combo = await getComboById(comboId);
  if (!combo) {
    notFound();
  }

  return <ComboDetailContent combo={combo} />;
}
