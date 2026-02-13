import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'success' | 'warning';
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: Action[];
  children?: ReactNode;
}

export default function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions?.map((action, i) =>
            action.href ? (
              <Button key={i} variant={action.variant || 'default'} asChild disabled={action.disabled}>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button
                key={i}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            )
          )}
          {children}
        </div>
      )}
    </div>
  );
}
