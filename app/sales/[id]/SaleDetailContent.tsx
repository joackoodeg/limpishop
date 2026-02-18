'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getUnitShort } from '@/lib/units';
import type { Sale } from '@/lib/data/sales';

const PAYMENT_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  efectivo: 'default',
  tarjeta: 'secondary',
  transferencia: 'outline',
};

export default function SaleDetailContent({ sale }: { sale: Sale }) {
  const router = useRouter();

  async function handleDelete() {
    await fetch(`/api/sales/${sale.id}`, { method: 'DELETE' });
    toast.success('Venta eliminada y stock restaurado');
    router.push('/sales');
  }

  return (
    <div>
      <PageHeader title={`Venta #${sale.id}`}>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
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
              <Badge
                variant={PAYMENT_VARIANTS[sale.paymentMethod] ?? 'outline'}
                className="capitalize mt-1"
              >
                {sale.paymentMethod}
              </Badge>
            </div>
            {sale.employeeName && (
              <div>
                <p className="text-sm text-muted-foreground">Vendedor</p>
                <p className="font-medium">{sale.employeeName}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${sale.grandTotal.toFixed(2)}
              </p>
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
                  <span className="text-muted-foreground ml-2">
                    ({item.size ?? 1} {getUnitShort(item.unit || 'unidad')})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">
                    {item.quantity} × ${item.price} ={' '}
                  </span>
                  <span className="font-medium">
                    ${(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
