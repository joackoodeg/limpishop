import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../../../components/PageHeader';

export default function EditProductLoading() {
  return (
    <div>
      <PageHeader title="Editar Producto" actions={[{ label: 'Volver', href: '/products', variant: 'outline' }]} />
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-32 ml-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
