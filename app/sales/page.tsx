'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  size: number;
}

interface Sale {
  id: number;
  items: SaleItem[];
  grandTotal: number;
  paymentMethod: string;
  date: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(saleId: number) {
    await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
    toast.success('Venta eliminada y stock restaurado');
    fetchSales();
  }

  function matchesFilter(sale: Sale): boolean {
    const saleDate = new Date(sale.date);
    const afterFrom = from ? saleDate >= new Date(from) : true;
    const beforeTo = to ? saleDate <= new Date(to + 'T23:59:59') : true;
    const matchesProduct = sale.items.some(item =>
      item.productName.toLowerCase().includes(query.toLowerCase())
    );
    return matchesProduct && afterFrom && beforeTo;
  }

  const filtered = sales.filter(matchesFilter);

  return (
    <div>
      <PageHeader title="Historial de Ventas">
        <Button asChild>
          <Link href="/sales/new">Realizar Venta</Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 space-y-3"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))}
        </div>
      )}

      {/* Sales list */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">Venta #{sale.id}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(sale.date).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">Pago: {sale.paymentMethod}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-xl font-bold text-emerald-600">${sale.grandTotal.toFixed(2)}</span>
                    <ConfirmDialog
                      description="¿Eliminar esta venta? Se restaurará el stock."
                      onConfirm={() => handleDelete(sale.id)}
                      confirmLabel="Eliminar"
                    >
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  {sale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-muted-foreground ml-2">({item.size} uds)</span>
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
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Receipt className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
          title="No se encontraron ventas"
          description="Ajusta los filtros o realiza una nueva venta"
        />
      )}
    </div>
  );
}
