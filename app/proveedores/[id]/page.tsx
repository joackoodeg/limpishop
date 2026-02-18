import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';
import { SupplierDetailContent } from '@/app/components/SupplierDetailContent';
import {
  isProveedoresEnabled,
  getSupplierById,
  getSupplierProducts,
  getSupplierPayments,
  getSupplierBalance,
} from '@/lib/data/suppliers';

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;
  const supplier = await getSupplierById(parseInt(id));

  if (!supplier) {
    notFound();
  }

  const [products, payments, balance] = await Promise.all([
    getSupplierProducts(supplier.id),
    getSupplierPayments(supplier.id),
    getSupplierBalance(supplier.id),
  ]);

  return (
    <SupplierDetailContent
      supplier={supplier}
      initialProducts={products}
      initialPayments={payments}
      initialBalance={balance}
    />
  );
}
