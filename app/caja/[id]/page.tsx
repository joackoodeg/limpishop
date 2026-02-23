import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '@/app/components/PageHeader';
import { isCajaEnabled, getRegisterById } from '@/lib/data/cash-register';
import { getSalesByCashRegisterId } from '@/lib/data/sales';
import { ArrowLeft, Receipt, Calendar } from 'lucide-react';

interface CajaDetailPageProps {
  params: Promise<{ id: string }>;
}

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function CajaDetailPage({ params }: CajaDetailPageProps) {
  const { id } = await params;
  const cajaId = parseInt(id, 10);
  if (Number.isNaN(cajaId)) notFound();

  const cajaEnabled = await isCajaEnabled();
  if (!cajaEnabled) notFound();

  const [register, orders] = await Promise.all([
    getRegisterById(cajaId),
    getSalesByCashRegisterId(cajaId),
  ]);

  if (!register) notFound();

  const totalVentas = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title={`Caja #${register.id}`}
        description={
          register.status === 'open'
            ? 'Caja abierta'
            : `Cerrada el ${register.closedAt ? fmtDate(register.closedAt) : '—'}`
        }
      >
        <Button variant="outline" asChild>
          <Link href="/caja">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Caja
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Resumen de la caja
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Apertura</p>
              <p className="font-medium">{fmtDate(register.openedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cierre</p>
              <p className="font-medium">
                {register.closedAt ? fmtDate(register.closedAt) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monto inicial</p>
              <p className="font-medium">{fmt(register.openingAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monto cierre</p>
              <p className="font-medium">
                {register.closingAmount != null ? fmt(register.closingAmount) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Esperado</p>
              <p className="font-medium">
                {register.expectedAmount != null
                  ? fmt(register.expectedAmount)
                  : fmt(register.calculatedExpected)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Diferencia</p>
              <p
                className={`font-medium ${
                  (register.difference ?? 0) < 0
                    ? 'text-red-600'
                    : (register.difference ?? 0) > 0
                      ? 'text-green-600'
                      : ''
                }`}
              >
                {register.difference != null ? fmt(register.difference) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Órdenes de esta caja
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {orders.length} venta{orders.length !== 1 ? 's' : ''} · Total{' '}
              <span className="font-semibold">{fmt(totalVentas)}</span>
            </p>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay ventas registradas en esta caja
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venta</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Medio de pago</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">#{sale.id}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {fmtDate(sale.date)}
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {sale.paymentMethod}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fmt(sale.grandTotal)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/sales/${sale.id}`}>
                              Ver
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
