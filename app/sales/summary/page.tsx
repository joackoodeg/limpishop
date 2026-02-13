"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../../components/PageHeader';

interface ProductStat {
  id: number;
  productName: string;
  quantity: number;
  revenue: number;
  costTotal?: number;
  netRevenue?: number;
}

export default function SalesSummaryPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ overall: { units: number; revenue: number; net: number }; products: ProductStat[] } | null>(null);

  async function fetchSummary() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/sales/summary?${params.toString()}`);
      const data = await res.json();
      setStats({ overall: data.overall, products: data.products });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Resumen de Ventas" />

      {/* Date filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        <Button onClick={fetchSummary} disabled={loading}>
          {loading ? 'Cargando…' : 'Aplicar'}
        </Button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 text-center"><Skeleton className="h-4 w-24 mx-auto mb-2" /><Skeleton className="h-8 w-20 mx-auto" /></CardContent></Card>
          ))}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Ingresos totales</p>
                <p className="text-2xl font-bold">${stats.overall.revenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Unidades vendidas</p>
                <p className="text-2xl font-bold">{stats.overall.units}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Ingreso neto</p>
                <p className="text-2xl font-bold text-emerald-600">${stats.overall.net.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Products table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.products.map((p) => (
                      <tr key={p.id || p.productName}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{p.productName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{p.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">${p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
