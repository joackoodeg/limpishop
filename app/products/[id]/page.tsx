'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, Pencil, Trash2, Package, Scale, Droplet, Boxes } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge, { movementBadgeType, movementLabel } from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from 'sonner';
import { getUnitLabel, getUnitShort, formatStock } from '@/lib/units';
import { UNIT_OPTIONS } from '@/lib/units';

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
  unit?: string;
  categoryName?: string;
  categoryId?: number;
  imageUrl?: string;
}

interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string;
  referenceId: number | null;
  createdAt: string;
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
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
        // Fetch recent stock movements
        try {
          const stockRes = await fetch(`/api/stock/${id}?limit=5`);
          if (stockRes.ok) {
            const stockData = await stockRes.json();
            setStockHistory(stockData.movements || []);
          }
        } catch {}
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
        <Button variant="warning" asChild>
          <Link href={`/products/${product.id}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </Link>
        </Button>
        <ConfirmDialog
          description="¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          confirmLabel="Eliminar"
        >
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </ConfirmDialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-4">
            <StatusBadge type={product.active ? 'active' : 'inactive'} />
            {product.featured && <StatusBadge type="featured" />}
          </div>

          {product.categoryName && (
            <p className="text-sm text-primary mb-3 flex items-center gap-1">
              <Folder className="h-4 w-4" aria-hidden="true" />
              {product.categoryName}
            </p>
          )}

          {/* Unit badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {product.unit === 'kilo' ? (
                <Scale className="h-4 w-4" />
              ) : product.unit === 'litro' ? (
                <Droplet className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              {UNIT_OPTIONS.find(o => o.value === (product.unit || 'unidad'))?.label || 'Unidad'}
            </span>
          </div>

          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2">
              Precios por {getUnitLabel(product.unit || 'unidad', 2)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.prices?.map((p, index) => {
                const totalCost = (product.cost || 0) * p.quantity;
                const margin = p.price - totalCost;
                return (
                  <div key={index} className="px-3 py-2 bg-muted rounded-lg text-sm">
                    <div>
                      {p.quantity} {getUnitLabel(product.unit || 'unidad', p.quantity)} — <strong>${p.price}</strong>
                    </div>
                    {product.cost != null && product.cost > 0 && (
                      <div className={`text-xs mt-0.5 ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        Margen: {margin >= 0 ? '+' : ''}{margin.toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Costo:</span>
              <span className="ml-2 font-medium">${product.cost}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Stock:</span>
              <span className="ml-2 font-medium">{formatStock(product.stock, product.unit || 'unidad')}</span>
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

      {/* Stock History */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Últimos movimientos de stock
            </h2>
            <Link
              href={`/stock?product=${product.id}`}
              className="text-xs text-primary hover:underline font-medium"
            >
              Ver historial completo →
            </Link>
          </div>

          {stockHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-2">
              {stockHistory.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge type={movementBadgeType(m.type)} label={movementLabel(m.type)} />
                    <span className={`font-medium ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                    <span className="text-muted-foreground">→ {m.newStock}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/stock?product=${product.id}`}>
                <Boxes className="h-4 w-4 mr-2" />
                Gestionar stock de este producto
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
