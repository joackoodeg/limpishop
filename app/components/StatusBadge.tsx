import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type StatusType = 'active' | 'inactive' | 'featured' | 'inStock' | 'lowStock' | 'outOfStock';

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

export function stockStatus(stock: number): StatusType {
  if (stock === 0) return 'outOfStock';
  if (stock <= 5) return 'lowStock';
  return 'inStock';
}

export function stockLabel(stock: number): string {
  if (stock === 0) return `Stock: ${stock} (Agotado)`;
  if (stock <= 5) return `Stock: ${stock} (Bajo)`;
  return `Stock: ${stock}`;
}
