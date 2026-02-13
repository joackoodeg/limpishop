'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from 'sonner';

interface Price {
  quantity: number;
  price: number;
}

interface Product {
  id: number;
  name: string;
  prices: Price[];
  cost?: number;
  stock: number;
  description?: string;
  active?: boolean;
  featured?: boolean;
  categoryName?: string;
  categoryId?: number;
  imageUrl?: string;
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      async function fetchProduct() {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
        setLoading(false);
      }
      fetchProduct();
    }
  }, [id]);

  async function handleDelete() {
    if (!product) return;
    await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    toast.success('Producto eliminado');
    router.push('/products');
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-8 text-muted-foreground">Producto no encontrado</div>;
  }

  return (
    <div>
      <PageHeader title={product.name}>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
        <Button variant="secondary" asChild>
          <Link href={`/products/${product.id}/edit`}>Editar</Link>
        </Button>
        <ConfirmDialog
          description="¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          confirmLabel="Eliminar"
        >
          <Button variant="destructive">Eliminar</Button>
        </ConfirmDialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-4">
            <StatusBadge type={product.active ? 'active' : 'inactive'} />
            {product.featured && <StatusBadge type="featured" />}
          </div>

          {product.categoryName && (
            <p className="text-sm text-primary mb-3">📁 {product.categoryName}</p>
          )}

          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2">Precios</h2>
            <div className="flex flex-wrap gap-2">
              {product.prices?.map((p, index) => (
                <span key={index} className="px-3 py-1.5 bg-muted rounded-md text-sm">
                  {p.quantity} unidad(es) — <strong>${p.price}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Costo:</span>
              <span className="ml-2 font-medium">${product.cost}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Stock:</span>
              <span className="ml-2 font-medium">{product.stock}</span>
            </div>
          </div>

          {product.description && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Descripción:</span>
              <p className="mt-1">{product.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
