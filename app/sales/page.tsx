import { Suspense } from 'react';
import { getSales } from '@/lib/data/sales';
import { SalesListContent } from '../components/SalesListContent';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const revalidate = 60;

interface SalesPageProps {
  searchParams: Promise<{ from?: string; to?: string; metodo?: string; empleado?: string }>;
}

function SalesLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-3">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams;
  const sales = await getSales({
    from: params.from,
    to: params.to,
  });

  return (
    <Suspense fallback={<SalesLoading />}>
      <SalesListContent
        initialSales={sales}
        initialMetodo={params.metodo ?? ''}
        initialEmpleado={params.empleado ?? ''}
      />
    </Suspense>
  );
}
