import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../../../components/PageHeader';

export default function EditComboLoading() {
  return (
    <div>
      <PageHeader title="Editar Combo" actions={[{ label: 'Volver', href: '/combos', variant: 'outline' }]} />
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
