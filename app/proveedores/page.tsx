import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { ProveedoresContent } from '../components/ProveedoresContent';
import {
  isProveedoresEnabled,
  getSuppliersWithBalance,
} from '@/lib/data/suppliers';

export default async function ProveedoresPage() {
  const proveedoresEnabled = await isProveedoresEnabled();

  if (!proveedoresEnabled) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Proveedores" description="Módulo no habilitado" />
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              El módulo de Proveedores no está habilitado. Activalo desde la
              configuración.
            </p>
            <Button asChild>
              <Link href="/config">Ir a Configuración</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const suppliers = await getSuppliersWithBalance();

  return <ProveedoresContent initialSuppliers={suppliers} />;
}
