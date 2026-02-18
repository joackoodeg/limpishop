'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, FileText, Folder, Gift, Package, ShoppingCart, Layers, Users, ClipboardList, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import type { EnabledModules } from '@/lib/types/config';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
}

interface QuickLink {
  href: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  description: string;
  module?: keyof EnabledModules;
  adminOnly?: boolean;
}

const quickLinks: QuickLink[] = [
  { href: '/sales/new', label: 'Nueva Venta', icon: ShoppingCart, iconColor: 'text-cyan-500', description: 'Registrar venta' },
  { href: '/sales', label: 'Ventas', icon: BarChart3, iconColor: 'text-cyan-500', description: 'Historial de ventas' },
  { href: '/caja', label: 'Caja Diaria', icon: ClipboardList, iconColor: 'text-cyan-500', description: 'Abrir / cerrar caja', module: 'cajaDiaria' },
  { href: '/products', label: 'Productos', icon: Package, iconColor: 'text-cyan-500', description: 'Gestionar catálogo', adminOnly: true },
  { href: '/stock', label: 'Stock', icon: Layers, iconColor: 'text-cyan-500', description: 'Control de inventario', adminOnly: true },
  { href: '/categories', label: 'Categorías', icon: Folder, iconColor: 'text-cyan-500', description: 'Organizar productos', adminOnly: true },
  { href: '/combos', label: 'Combos', icon: Gift, iconColor: 'text-cyan-500', description: 'Ofertas especiales', adminOnly: true },
  { href: '/empleados', label: 'Empleados', icon: Users, iconColor: 'text-cyan-500', description: 'Gestionar personal', module: 'empleados', adminOnly: true },
  { href: '/catalog', label: 'Catálogo', icon: FileText, iconColor: 'text-cyan-500', description: 'Ver catálogo', adminOnly: true },
  { href: '/config', label: 'Configuración', icon: Settings, iconColor: 'text-cyan-500', description: 'Ajustes del negocio', adminOnly: true },
];

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const { isModuleEnabled } = useStoreConfig();

  const isEmployee = currentUser !== null && currentUser.role !== 'admin';

  const visibleLinks = quickLinks.filter((link) => {
    if (link.module && !isModuleEnabled(link.module)) return false;
    if (link.adminOnly && isEmployee) return false;
    return true;
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setCurrentUser({ role: data.role });
      })
      .catch(() => {});
  }, []);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center text-center pt-6 pb-4">
                  <link.icon className={`h-8 w-8 mb-2 ${link.iconColor}`} aria-hidden="true" />
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
