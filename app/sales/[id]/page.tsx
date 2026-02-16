'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getUnitShort } from '@/lib/units';

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  size: number;
  unit: string;
}

interface Sale {
  id: number;
  items: SaleItem[];
  grandTotal: number;
  paymentMethod: string;
  date: string;
}

export default function SaleDetailsPage() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    async function fetchSale() {
      const res = await fetch(`/api/sales/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSale(data);
      }
      setLoading(false);
    }
    fetchSale();
  }, [id]);

  async function handleDelete() {
    if (!sale) return;
    await fetch(`/api/sales/${sale.id}`, { method: 'DELETE' });
    toast.success('Venta eliminada y stock restaurado');
    router.push('/sales');
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sale) {
    return <div className="text-center py-8 text-muted-foreground">Venta no encontrada</div>;
  }

  return (
    <div>
      <PageHeader title={`Venta #${sale.id}`}>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
        <ConfirmDialog
          description="¿Eliminar esta venta? Se restaurará el stock."
          onConfirm={handleDelete}
          confirmLabel="Eliminar"
        >
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </ConfirmDialog>
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">{new Date(sale.date).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Método de pago</p>
              <p className="font-medium capitalize">{sale.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-emerald-600">${sale.grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="space-y-2">
            {sale.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-muted-foreground ml-2">({item.size} {getUnitShort(item.unit || 'unidad')})</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">{item.quantity} × ${item.price} = </span>
                  <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
