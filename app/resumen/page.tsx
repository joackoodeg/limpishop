"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Package,
  TrendingUp,
  BarChart3,
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

interface ProductStat {
  id: number;
  productName: string;
  quantity: number;
  revenue: number;
  costUnit: number;
  costTotal: number;
  netRevenue: number;
}

interface SummaryData {
  overall: { units: number; revenue: number; cost: number; net: number };
  products: ProductStat[];
}

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

type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  switch (preset) {
    case 'today':
      return { from: to, to };
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split('T')[0], to };
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return { from: d.toISOString().split('T')[0], to };
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().split('T')[0], to };
    }
    default:
      return { from: '', to: '' };
  }
}

export default function ResumenPage() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activePreset, setActivePreset] = useState<DatePreset | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SummaryData | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue' | 'netRevenue'>('quantity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  async function fetchSummary(fromDate?: string, toDate?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const f = fromDate ?? from;
      const t = toDate ?? to;
      if (f) params.set('from', f);
      if (t) params.set('to', t);
      const res = await fetch(`/api/sales/summary?${params.toString()}`);
      const data = await res.json();
      setStats({ overall: data.overall, products: data.products });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSales(fromDate?: string, toDate?: string) {
    setSalesLoading(true);
    try {
      const params = new URLSearchParams();
      const f = fromDate ?? from;
      const t = toDate ?? to;
      if (f) params.set('from', f);
      if (t) params.set('to', t);
      const res = await fetch(`/api/sales?${params.toString()}`);
      const data = await res.json();
      setSales(data);
    } finally {
      setSalesLoading(false);
    }
  }

  function applyPreset(preset: DatePreset) {
    setActivePreset(preset);
    if (preset === 'custom') return;
    const { from: f, to: t } = getPresetDates(preset);
    setFrom(f);
    setTo(t);
    fetchSummary(f, t);
    fetchSales(f, t);
  }

  function applyFilters() {
    fetchSummary();
    fetchSales();
  }

  useEffect(() => {
    fetchSummary();
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedProducts = useMemo(() => {
    if (!stats) return [];
    const sorted = [...stats.products];
    sorted.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });
    return sorted;
  }, [stats, sortBy, sortDir]);

  const maxQuantity = useMemo(() => {
    if (!stats || stats.products.length === 0) return 1;
    return Math.max(...stats.products.map((p) => p.quantity));
  }, [stats]);

  function handleSort(col: 'quantity' | 'revenue' | 'netRevenue') {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  }

  const presets: { label: string; value: DatePreset }[] = [
    { label: 'Hoy', value: 'today' },
    { label: 'Última semana', value: 'week' },
    { label: 'Último mes', value: 'month' },
    { label: 'Último año', value: 'year' },
    { label: 'Personalizado', value: 'custom' },
  ];

  const marginPercent =
    stats && stats.overall.revenue > 0
      ? ((stats.overall.net / stats.overall.revenue) * 100).toFixed(1)
      : '0';

  return (
    <div>
      <PageHeader
        title="Resumen de Ventas"
        description="Análisis de ingresos, costos y productos más vendidos"
      />

      {/* Date presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={activePreset === p.value ? 'default' : 'outline'}
            onClick={() => applyPreset(p.value)}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {p.label}
          </Button>
        ))}
      </div>

      {/* Custom date filters */}
      {activePreset === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-lg border bg-muted/30">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={applyFilters} disabled={loading || salesLoading}>
              {loading ? 'Cargando…' : 'Aplicar filtro'}
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Ingresos totales */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ingresos totales</p>
                      <p className="text-2xl font-bold mt-1">
                        ${stats.overall.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unidades vendidas */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Productos vendidos</p>
                      <p className="text-2xl font-bold mt-1">
                        {stats.overall.units.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Costo total */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Costo total</p>
                      <p className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">
                        ${stats.overall.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <ArrowDownRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ganancia neta */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ganancia neta</p>
                      <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                        ${stats.overall.net.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                        {marginPercent}% margen
                      </Badge>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Detalle por producto</CardTitle>
                </div>
                <Badge variant="outline">{sortedProducts.length} productos</Badge>
              </CardHeader>
              <CardContent>
                {sortedProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay ventas en el período seleccionado
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Producto
                          </th>
                          <th
                            className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => handleSort('quantity')}
                          >
                            Cantidad{' '}
                            {sortBy === 'quantity' && (sortDir === 'desc' ? '↓' : '↑')}
                          </th>
                          <th
                            className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => handleSort('revenue')}
                          >
                            Ingresos{' '}
                            {sortBy === 'revenue' && (sortDir === 'desc' ? '↓' : '↑')}
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                            Costo
                          </th>
                          <th
                            className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => handleSort('netRevenue')}
                          >
                            Ganancia{' '}
                            {sortBy === 'netRevenue' && (sortDir === 'desc' ? '↓' : '↑')}
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell w-32">
                            Participación
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sortedProducts.map((p, idx) => {
                          const barWidth =
                            maxQuantity > 0 ? (p.quantity / maxQuantity) * 100 : 0;
                          const profitMargin =
                            p.revenue > 0
                              ? ((p.netRevenue / p.revenue) * 100).toFixed(0)
                              : '0';
                          return (
                            <tr
                              key={p.id || p.productName}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground font-mono w-5">
                                    {idx + 1}
                                  </span>
                                  <span className="text-sm font-medium">{p.productName}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                                {p.quantity}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                                ${p.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-muted-foreground hidden sm:table-cell">
                                ${p.costTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                                <span
                                  className={
                                    p.netRevenue >= 0
                                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                      : 'text-red-600 dark:text-red-400 font-medium'
                                  }
                                >
                                  ${p.netRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({profitMargin}%)
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-right hidden md:table-cell">
                                <div className="flex items-center gap-2 justify-end">
                                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary/70 rounded-full transition-all"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Totals row */}
                      <tfoot>
                        <tr className="border-t-2 font-semibold">
                          <td className="px-3 py-3 text-sm">Total</td>
                          <td className="px-3 py-3 text-right text-sm">
                            {stats.overall.units.toLocaleString('es-AR')}
                          </td>
                          <td className="px-3 py-3 text-right text-sm">
                            ${stats.overall.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-right text-sm hidden sm:table-cell">
                            ${stats.overall.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                            ${stats.overall.net.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="hidden md:table-cell" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales list */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Ventas del período</CardTitle>
                </div>
                <Badge variant="outline">{sales.length} ventas</Badge>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : sales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay ventas en el período seleccionado
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Venta
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Pago
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Ítems
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sales.map((sale) => (
                          <tr
                            key={sale.id}
                            className="hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/sales/${sale.id}`)}
                          >
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                              Venta #{sale.id}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(sale.date).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm capitalize">
                              {sale.paymentMethod}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium text-emerald-600">
                              ${sale.grandTotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-muted-foreground">
                              {sale.items.length}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}
