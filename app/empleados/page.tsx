import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { EmpleadosContent } from '../components/EmpleadosContent';
import {
  isEmpleadosEnabled,
  getEmployees,
} from '@/lib/data/employees';

export default async function EmpleadosPage() {
  const empleadosEnabled = await isEmpleadosEnabled();

  if (!empleadosEnabled) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Empleados" description="Módulo no habilitado" />
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              El módulo de Empleados no está habilitado. Activalo desde la
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

  const employees = await getEmployees();

  return <EmpleadosContent initialEmployees={employees} />;
}
