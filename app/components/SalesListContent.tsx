'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LayoutGrid, LayoutList, Receipt, Trash2 } from 'lucide-react';
import PageHeader from './PageHeader';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';
import { getUnitShort } from '@/lib/units';
import type { Sale } from '@/lib/data/sales';

// ── Types ────────────────────────────────────────────────────────────────────
interface SalesListContentProps {
  initialSales: Sale[];
  initialMetodo?: string;
  initialEmpleado?: string;
}

type ViewMode = 'cards' | 'table';

// ── Payment method badge ─────────────────────────────────────────────────────
const PAYMENT_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  efectivo: 'default',
  tarjeta: 'secondary',
  transferencia: 'outline',
};

function PaymentBadge({ method }: { method: string }) {
  return (
    <Badge variant={PAYMENT_VARIANTS[method] ?? 'outline'} className="capitalize">
      {method}
    </Badge>
  );
}

// ── Filters ─────────────────────────────────────────────────────────────────
function matchesProductFilter(sale: Sale, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return sale.items.some((item) => item.productName.toLowerCase().includes(q));
}

// ── Main component ───────────────────────────────────────────────────────────
export function SalesListContent({
  initialSales,
  initialMetodo = '',
  initialEmpleado = '',
}: SalesListContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from') ?? '';
  const toParam = searchParams.get('to') ?? '';

  const [query, setQuery] = useState('');
  const [from, setFrom] = useState(fromParam);
  const [to, setTo] = useState(toParam);
  const [metodo, setMetodo] = useState(initialMetodo);
  const [empleado, setEmpleado] = useState(initialEmpleado);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);

  // Unique employee names from current sales data
  const employeeOptions = Array.from(
    new Set(sales.map((s) => s.employeeName).filter(Boolean) as string[]),
  ).sort();

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (metodo) params.set('metodo', metodo);
    if (empleado) params.set('empleado', empleado);
    router.push(`/sales${params.toString() ? `?${params.toString()}` : ''}`);
  }, [from, to, metodo, empleado, router]);

  const filtered = sales.filter(
    (sale) =>
      matchesProductFilter(sale, query) &&
      (metodo === '' || sale.paymentMethod === metodo) &&
      (empleado === '' || sale.employeeName === empleado),
  );

  // Period stats
  const periodTotal = filtered.reduce((sum, s) => sum + s.grandTotal, 0);
  const periodCount = filtered.length;

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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[160px]"
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
        <Select
          value={metodo || 'all-methods'}
          onValueChange={(value) => setMetodo(value === 'all-methods' ? '' : value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-methods">Todos los métodos</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
          </SelectContent>
        </Select>
        {employeeOptions.length > 0 && (
          <Select
            value={empleado || 'all-employees'}
            onValueChange={(value) => setEmpleado(value === 'all-employees' ? '' : value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-employees">Todos los vendedores</SelectItem>
              {employeeOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="secondary" onClick={applyFilters}>
          Filtrar
        </Button>
      </div>

      {/* Period stats + view toggle */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 rounded-lg bg-muted">
          <div className="flex gap-6 text-sm">
            <span>
              <span className="text-muted-foreground">Ventas:</span>{' '}
              <span className="font-semibold">{periodCount}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Total período:</span>{' '}
              <span className="font-semibold text-emerald-600">
                ${periodTotal.toFixed(2)}
              </span>
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              onClick={() => setViewMode('cards')}
              aria-label="Vista tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              aria-label="Vista tabla"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && filtered.length > 0 && (
        <div className="rounded-md border mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    <Link href={`/sales/${sale.id}`} className="hover:underline">
                      #{sale.id}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(sale.date).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge method={sale.paymentMethod} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {sale.employeeName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sale.items.map((item) => (
                      <div key={item.productId}>
                        {item.productName}{' '}
                        <span className="text-xs">
                          ×{item.quantity} ({item.size ?? 1}{' '}
                          {getUnitShort(item.unit || 'unidad')})
                        </span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    ${sale.grandTotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/sales/${sale.id}`}>Ver</Link>
                      </Button>
                      <ConfirmDialog
                        description="¿Eliminar esta venta? Se restaurará el stock."
                        onConfirm={() => handleDelete(sale.id)}
                        confirmLabel="Eliminar"
                      >
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cards view */}
      {viewMode === 'cards' && filtered.length > 0 && (
        <div className="space-y-3">
          {paginatedSales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="font-semibold hover:underline"
                    >
                      Venta #{sale.id}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.date).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <PaymentBadge method={sale.paymentMethod} />
                      {sale.employeeName && (
                        <span className="text-xs text-muted-foreground">
                          {sale.employeeName}
                        </span>
                      )}
                    </div>
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
          icon={
            <Receipt
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
          }
          title="No se encontraron ventas"
          description="Ajusta los filtros o realiza una nueva venta"
        />
      )}
    </div>
  );
}
