'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt, Trash2 } from 'lucide-react';
import PageHeader from './PageHeader';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';
import type { Sale } from '@/lib/data/sales';

interface SalesListContentProps {
  initialSales: Sale[];
}

function matchesProductFilter(sale: Sale, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return sale.items.some((item) => item.productName.toLowerCase().includes(q));
}

export function SalesListContent({ initialSales }: SalesListContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from') ?? '';
  const toParam = searchParams.get('to') ?? '';

  const [query, setQuery] = useState('');
  const [from, setFrom] = useState(fromParam);
  const [to, setTo] = useState(toParam);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    router.push(`/sales${params.toString() ? `?${params.toString()}` : ''}`);
  }, [from, to, router]);

  const filtered = sales.filter((sale) => matchesProductFilter(sale, query));
  const {
    paginatedItems: paginatedSales,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageSizeOptions,
    itemRange,
    hasNextPage,
    hasPrevPage,
    goToPage,
    setPageSize,
  } = usePagination(filtered, { defaultPageSize: 10 });

  async function handleDelete(saleId: number) {
    await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
    toast.success('Venta eliminada y stock restaurado');
    setSales((prev) => prev.filter((s) => s.id !== saleId));
  }

  return (
    <div>
      <PageHeader title="Historial de Ventas">
        <Button asChild>
          <Link href="/sales/new">Realizar Venta</Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-auto"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-auto"
        />
        <Button variant="secondary" onClick={applyFilters}>
          Filtrar
        </Button>
      </div>

      {filtered.length > 0 && (
        <div className="space-y-3">
          {paginatedSales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link
                      href={`/sales/${sale.id}`}
                      className="font-semibold hover:underline"
                    >
                      Venta #{sale.id}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Pago: {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-xl font-bold text-emerald-600">
                      ${sale.grandTotal.toFixed(2)}
                    </span>
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
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-muted-foreground ml-2">
                          ({item.size} uds)
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
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          itemRange={itemRange}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          itemLabel="ventas"
        />
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon={<Receipt className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
          title="No se encontraron ventas"
          description="Ajusta los filtros o realiza una nueva venta"
        />
      )}
    </div>
  );
}
