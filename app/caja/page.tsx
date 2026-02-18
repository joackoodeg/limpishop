import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { CajaContent } from '../components/CajaContent';
import {
  isCajaEnabled,
  getOpenRegister,
  getClosedRegisters,
} from '@/lib/data/cash-register';

export default async function CajaPage() {
  const cajaEnabled = await isCajaEnabled();

  if (!cajaEnabled) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Caja Diaria" description="Módulo no habilitado" />
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              El módulo de Caja Diaria no está habilitado. Activalo desde la
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

  const [openRegister, history] = await Promise.all([
    getOpenRegister(),
    getClosedRegisters(),
  ]);

  return (
    <CajaContent
      initialOpenRegister={openRegister}
      initialHistory={history}
    />
  );
}
