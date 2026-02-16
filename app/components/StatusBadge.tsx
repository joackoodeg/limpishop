import { Badge } from '@/components/ui/badge';
import { Star, PackagePlus, PackageMinus, PackageCheck, Settings2, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type StatusType = 'active' | 'inactive' | 'featured' | 'inStock' | 'lowStock' | 'outOfStock'
  | 'stockInicial' | 'stockReposicion' | 'stockVenta' | 'stockAjuste' | 'stockDevolucion';

const config: Record<
  StatusType,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string; icon?: LucideIcon }
> = {
  active: { label: 'Activo', variant: 'default', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' },
  inactive: { label: 'Inactivo', variant: 'secondary', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200' },
  featured: { label: 'Destacado', variant: 'default', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200', icon: Star },
  inStock: { label: 'En Stock', variant: 'default', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' },
  lowStock: { label: 'Poco Stock', variant: 'default', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200' },
  outOfStock: { label: 'Agotado', variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' },
  // Stock movement types
  stockInicial: { label: 'Inicial', variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200', icon: PackageCheck },
  stockReposicion: { label: 'Reposición', variant: 'default', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200', icon: PackagePlus },
  stockVenta: { label: 'Venta', variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200', icon: PackageMinus },
  stockAjuste: { label: 'Ajuste', variant: 'default', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200', icon: Settings2 },
  stockDevolucion: { label: 'Devolución', variant: 'default', className: 'bg-violet-100 text-violet-800 hover:bg-violet-100 border-violet-200', icon: RotateCcw },
};

interface StatusBadgeProps {
  type: StatusType;
  label?: string;
  className?: string;
}

export default function StatusBadge({ type, label, className = '' }: StatusBadgeProps) {
  const c = config[type];
  return (
    <Badge variant="outline" className={`${c.className} ${className} text-xs font-medium`}>
      <span className="inline-flex items-center gap-1">
        {c.icon && <c.icon className="h-3 w-3" aria-hidden="true" />}
        {label || c.label}
      </span>
    </Badge>
  );
}

export function stockStatus(stock: number, unit: string = 'unidad'): StatusType {
  if (stock <= 0) return 'outOfStock';
  const threshold = unit === 'unidad' ? 5 : 2;
  if (stock <= threshold) return 'lowStock';
  return 'inStock';
}

export function stockLabel(stock: number, unit: string = 'unidad'): string {
  const short = unit === 'kilo' ? 'kg' : unit === 'litro' ? 'L' : 'uds';
  const formatted = unit === 'unidad' ? String(Math.round(stock)) : (stock % 1 === 0 ? String(stock) : stock.toFixed(2));
  const label = `Stock: ${formatted} ${short}`;
  if (stock <= 0) return `${label} (Agotado)`;
  const threshold = unit === 'unidad' ? 5 : 2;
  if (stock <= threshold) return `${label} (Bajo)`;
  return label;
}

/** Map stock movement type string to StatusType for badge rendering */
export function movementBadgeType(type: string): StatusType {
  switch (type) {
    case 'inicial': return 'stockInicial';
    case 'reposicion': return 'stockReposicion';
    case 'venta': return 'stockVenta';
    case 'ajuste': return 'stockAjuste';
    case 'devolucion': return 'stockDevolucion';
    default: return 'stockAjuste';
  }
}

/** Human-readable label for movement type */
export function movementLabel(type: string): string {
  switch (type) {
    case 'inicial': return 'Stock Inicial';
    case 'reposicion': return 'Reposición';
    case 'venta': return 'Venta';
    case 'ajuste': return 'Ajuste';
    case 'devolucion': return 'Devolución';
    default: return type;
  }
}
