'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import PageHeader from './PageHeader';
import { DashboardCharts } from './DashboardCharts';
import { formatPrice } from '@/lib/utils';
import type { SalesSummary, Sale } from '@/lib/data/sales';

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

interface ResumenContentProps {
  initialSummary: SalesSummary;
  initialSales: Sale[];
  fromParam: string;
  toParam: string;
  activePreset: DatePreset;
}

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Hoy', value: 'today' },
  { label: 'Última semana', value: 'week' },
  { label: 'Último mes', value: 'month' },
  { label: 'Último año', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
];

export function ResumenContent({
  initialSummary,
  initialSales,
  fromParam,
  toParam,
  activePreset: initialActivePreset,
}: ResumenContentProps) {
  const router = useRouter();
  const [stats, setStats] = useState<SalesSummary>(initialSummary);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [from, setFrom] = useState(fromParam);
  const [to, setTo] = useState(toParam);
  const [activePreset, setActivePreset] = useState<DatePreset>(initialActivePreset);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue' | 'netRevenue'>('quantity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setStats(initialSummary);
    setSales(initialSales);
    setFrom(fromParam);
    setTo(toParam);
    setActivePreset(initialActivePreset);
  }, [initialSummary, initialSales, fromParam, toParam, initialActivePreset]);

  const applyPreset = useCallback(
    (preset: DatePreset) => {
      setActivePreset(preset);
      if (preset === 'custom') {
        router.push('/resumen');
        return;
      }
      const { from: f, to: t } = getPresetDates(preset);
      setFrom(f);
      setTo(t);
      router.push(`/resumen?from=${f}&to=${t}`);
    },
    [router]
  );

  const applyFilters = useCallback(() => {
    if (!from || !to) return;
    router.push(`/resumen?from=${from}&to=${to}`);
  }, [router, from, to]);

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

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p) => (
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
            <Button onClick={applyFilters}>Aplicar filtro</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos totales</p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(stats.overall.revenue)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Costo total</p>
                <p className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">
                  {formatPrice(stats.overall.cost)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ganancia neta</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {formatPrice(stats.overall.net)}
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

      <DashboardCharts />

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
                      Cantidad {sortBy === 'quantity' && (sortDir === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('revenue')}
                    >
                      Ingresos {sortBy === 'revenue' && (sortDir === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Costo
                    </th>
                    <th
                      className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('netRevenue')}
                    >
                      Ganancia {sortBy === 'netRevenue' && (sortDir === 'desc' ? '↓' : '↑')}
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
                        key={p.id ?? p.productName ?? idx}
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
                          {formatPrice(p.revenue)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-muted-foreground hidden sm:table-cell">
                          {formatPrice(p.costTotal)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                          <span
                            className={
                              p.netRevenue >= 0
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-red-600 dark:text-red-400 font-medium'
                            }
                          >
                            {formatPrice(p.netRevenue)}
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
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="px-3 py-3 text-sm">Total</td>
                    <td className="px-3 py-3 text-right text-sm">
                      {stats.overall.units.toLocaleString('es-AR')}
                    </td>
                    <td className="px-3 py-3 text-right text-sm">
                      {formatPrice(stats.overall.revenue)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm hidden sm:table-cell">
                      {formatPrice(stats.overall.cost)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                      {formatPrice(stats.overall.net)}
                    </td>
                    <td className="hidden md:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Ventas del período</CardTitle>
          </div>
          <Badge variant="outline">{sales.length} ventas</Badge>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
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
                        {formatPrice(sale.grandTotal)}
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
    </div>
  );
}
