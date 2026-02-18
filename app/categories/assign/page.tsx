import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/server-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tags } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import AssignProductsContent from './AssignProductsContent';

export const metadata: Metadata = {
  title: 'Asignar Productos a Categorías',
  description: 'Administra qué productos pertenecen a cada categoría.',
};

export default async function AssignProductsPage() {
  const base = await getBaseUrl();
  const [catRes, prodRes] = await Promise.all([
    fetch(`${base}/api/categories`, { cache: 'no-store' }),
    fetch(`${base}/api/products`, { cache: 'no-store' }),
  ]);
  const categories = catRes.ok ? await catRes.json() : [];
  const products = prodRes.ok ? await prodRes.json() : [];

  if (categories.length === 0) {
    return (
      <div>
        <PageHeader
          title="Asignar Productos a Categorías"
          actions={[{ label: 'Volver a Categorías', href: '/categories', variant: 'outline' }]}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tags className="h-10 w-10 text-muted-foreground mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold">No hay categorías</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Primero crea algunas categorías para poder asignar productos
              </p>
              <Button className="mt-4" asChild>
                <a href="/categories">Crear Categorías</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AssignProductsContent initialCategories={categories} initialProducts={products} />
  );
}
