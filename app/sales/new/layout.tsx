import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nueva Venta',
  description: 'Registrar una nueva venta.',
};

export default function NewSaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
