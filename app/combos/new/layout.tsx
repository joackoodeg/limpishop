import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo Combo',
  description: 'Crear un nuevo combo de productos.',
};

export default function NewComboLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
