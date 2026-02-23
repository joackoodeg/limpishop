'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  FileText,
  Folder,
  Gift,
  Package,
  ShoppingCart,
  Layers,
  Users,
  ClipboardList,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import type { EnabledModules } from '@/lib/types/config';
import { formatPrice } from '@/lib/utils';
import type { DashboardStats } from '@/lib/data/dashboard';

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
  { href: '/catalogo', label: 'Catálogo / Reportes PDF', icon: FileText, iconColor: 'text-cyan-500', description: 'Reportes PDF con productos, descripción y categoría', adminOnly: true },
  { href: '/config', label: 'Configuración', icon: Settings, iconColor: 'text-cyan-500', description: 'Ajustes del negocio', adminOnly: true },
];

interface DashboardContentProps {
  stats: DashboardStats;
  userRole: string | null;
}

export function DashboardContent({ stats, userRole }: DashboardContentProps) {
  const { isModuleEnabled } = useStoreConfig();
  const isEmployee = userRole !== null && userRole !== 'admin';

  const visibleLinks = quickLinks.filter((link) => {
    if (link.module && !isModuleEnabled(link.module)) return false;
    if (link.adminOnly && isEmployee) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a Limpi — resumen del día</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Productos', value: stats.totalProducts, valueClass: '' },
          { label: 'Stock Bajo', value: stats.lowStockProducts, valueClass: 'text-amber-600' },
          { label: 'Ventas Hoy', value: `${stats.todaySales} uds`, valueClass: '' },
          { label: 'Ingresos Hoy', value: formatPrice(stats.todayRevenue), valueClass: 'text-emerald-600' },
        ].map((stat, i) => (
          <Card
            key={stat.label}
            className="animate-page-in"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:bg-accent/50 hover:shadow-md transition-colors transition-shadow duration-200 cursor-pointer">
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
