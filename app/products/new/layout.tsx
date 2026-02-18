import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo Producto',
  description: 'Añadir un nuevo producto al catálogo.',
};

export default function NewProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
