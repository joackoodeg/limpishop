'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, FileText, Folder, Gift, Package, ShoppingCart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
}

const quickLinks: Array<{ href: string; label: string; icon: LucideIcon; description: string }> = [
  { href: '/products', label: 'Productos', icon: Package, description: 'Gestionar catálogo' },
  { href: '/sales/new', label: 'Nueva Venta', icon: ShoppingCart, description: 'Registrar venta' },
  { href: '/categories', label: 'Categorías', icon: Folder, description: 'Organizar productos' },
  { href: '/combos', label: 'Combos', icon: Gift, description: 'Ofertas especiales' },
  { href: '/sales', label: 'Ventas', icon: BarChart3, description: 'Historial de ventas' },
  { href: '/reports', label: 'Reportes', icon: FileText, description: 'Generar PDF' },
];

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, summaryRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/sales/summary?from=' + new Date().toISOString().split('T')[0]),
        ]);
        const products = await productsRes.json();
        const summary = await summaryRes.json();

        setStats({
          totalProducts: products.length,
          lowStockProducts: products.filter((p: any) => p.stock <= 5 && p.stock > 0).length,
          todaySales: summary.overall?.units || 0,
          todayRevenue: summary.overall?.revenue || 0,
        });
      } catch {
        setStats({ totalProducts: 0, lowStockProducts: 0, todaySales: 0, todayRevenue: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a Limpi — resumen del día</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stock Bajo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats?.lowStockProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ventas Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.todaySales} uds</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ${stats?.todayRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center text-center pt-6 pb-4">
                  <link.icon className="h-8 w-8 mb-2 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-sm">{link.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{link.description}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
