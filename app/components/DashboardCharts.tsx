'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import type { ChartsData } from '@/app/api/sales/charts/route';

// ─── Date helpers ───────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

type Preset = 'today' | 'week' | 'month' | 'year' | 'custom';

function getPresetDates(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = toISODate(today);

  if (preset === 'today') return { from: to, to };

  if (preset === 'week') {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { from: toISODate(from), to };
  }

  if (preset === 'month') {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return { from: toISODate(from), to };
  }

  if (preset === 'year') {
    const from = new Date(today);
    from.setFullYear(today.getFullYear() - 1);
    return { from: toISODate(from), to };
  }

  return { from: to, to };
}

// ─── Colour palette ─────────────────────────────────────────────────────────

const PIE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{' '}
          {p.dataKey === 'ingresos'
            ? formatPrice(Number(p.value))
            : p.value}
        </p>
      ))}
    </div>
  );
}

function PieCustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { method, total, count } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
      <p className="font-medium capitalize">{method}</p>
      <p className="text-muted-foreground">{count} ventas · {formatPrice(total)}</p>
    </div>
  );
}

// ─── Skeleton placeholders ───────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DashboardCharts() {
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } =
        preset === 'custom'
          ? { from: customFrom, to: customTo }
          : getPresetDates(preset);

      if (!from || !to) return;

      const params = new URLSearchParams({ from, to, paymentMethod });
      const res = await fetch(`/api/sales/charts?${params}`);
      if (!res.ok) throw new Error('Error al cargar datos');
      const json: ChartsData = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo, paymentMethod]);

  useEffect(() => {
    if (preset === 'custom' && (!customFrom || !customTo)) return;
    fetchData();
  }, [fetchData]);

  const presetButtons: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Análisis de Ventas</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset selector */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            {presetButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`px-3 py-1.5 transition-colors ${
                  preset === key
                    ? 'bg-cyan-500 text-white font-medium'
                    : 'hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Payment method filter */}
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="tarjeta">Tarjeta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom date range */}
      {preset === 'custom' && (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm bg-background"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm bg-background"
          />
          <button
            onClick={fetchData}
            className="rounded-md bg-cyan-500 px-3 py-1.5 text-sm text-white hover:bg-cyan-600 transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Charts grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : !data || (data.dailySales.length === 0 && data.topProducts.length === 0) ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">
            No hay datos para el período seleccionado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1 — Unidades vendidas por día */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unidades vendidas por día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.dailySales}>
                  <defs>
                    <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    name="Unidades"
                    stroke="#06b6d4"
                    fill="url(#gradVentas)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2 — Ingresos por día */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos por día ($)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.dailySales}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatPrice(v)}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke="#10b981"
                    fill="url(#gradIngresos)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3 — Top 10 productos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top 10 productos más vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.topProducts}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={110}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v: string) =>
                      v.length > 14 ? v.slice(0, 13) + '…' : v
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p style={{ color: '#06b6d4' }}>
                            Unidades: {payload[0]?.value}
                          </p>
                          <p className="text-muted-foreground">
                            {formatPrice(payload[0]?.payload?.revenue ?? 0)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="quantity" name="Unidades" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 4 — Distribución por método de pago */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Distribución por método de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {data.paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      dataKey="total"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.paymentMethods.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span className="capitalize text-xs">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
