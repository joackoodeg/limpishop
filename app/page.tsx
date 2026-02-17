import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, FileText, Folder, Gift, Package, ShoppingCart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getDashboardStats } from '@/lib/data/dashboard';
import DashboardStatsCards from './components/DashboardStatsCards';

// Revalidate dashboard every 30 seconds (ISR)
export const revalidate = 30;

const quickLinks: Array<{ href: string; label: string; icon: LucideIcon; description: string }> = [
  { href: '/products', label: 'Productos', icon: Package, description: 'Gestionar catálogo' },
  { href: '/sales/new', label: 'Nueva Venta', icon: ShoppingCart, description: 'Registrar venta' },
  { href: '/categories', label: 'Categorías', icon: Folder, description: 'Organizar productos' },
  { href: '/combos', label: 'Combos', icon: Gift, description: 'Ofertas especiales' },
  { href: '/sales', label: 'Ventas', icon: BarChart3, description: 'Historial de ventas' },
  { href: '/reports', label: 'Reportes', icon: FileText, description: 'Generar PDF' },
];

export default async function HomePage() {
  // Fetch stats server-side with revalidation
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del día</p>
      </div>

      {/* KPI Cards - Server-side rendered */}
      <DashboardStatsCards stats={stats} />

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
