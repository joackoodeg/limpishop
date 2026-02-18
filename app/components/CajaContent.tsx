'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageHeader from './PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Unlock,
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  Equal,
} from 'lucide-react';
import type { CashRegister, CashRegisterDetail, CashMovement } from '@/lib/data/cash-register';

const MOVEMENT_CATEGORIES = [
  { value: 'pago_proveedor', label: 'Pago a proveedor' },
  { value: 'retiro', label: 'Retiro de efectivo' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'otro', label: 'Otro' },
];

interface CajaContentProps {
  initialOpenRegister: CashRegisterDetail | null;
  initialHistory: CashRegister[];
}

export function CajaContent({
  initialOpenRegister,
  initialHistory,
}: CajaContentProps) {
  const router = useRouter();
  const [openRegister, setOpenRegister] = useState<CashRegisterDetail | null>(initialOpenRegister);
  const [history, setHistory] = useState<CashRegister[]>(initialHistory);

  useEffect(() => {
    setOpenRegister(initialOpenRegister);
    setHistory(initialHistory);
  }, [initialOpenRegister, initialHistory]);

  const [openingAmount, setOpeningAmount] = useState('');
  const [openNote, setOpenNote] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const [closingAmount, setClosingAmount] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const [movType, setMovType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movAmount, setMovAmount] = useState('');
  const [movDescription, setMovDescription] = useState('');
  const [movCategory, setMovCategory] = useState('otro');
  const [isAddingMov, setIsAddingMov] = useState(false);

  const handleOpenCaja = async () => {
    setIsOpening(true);
    try {
      const body: Record<string, unknown> = { note: openNote };
      if (openingAmount !== '') body.openingAmount = Number(openingAmount);
      const res = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      if (data.usedPreviousAmount) {
        toast.success('Caja abierta con el monto de cierre de la caja anterior');
      } else {
        toast.success('Caja abierta');
      }
      setOpeningAmount('');
      setOpenNote('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al abrir caja');
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseCaja = async () => {
    if (!closingAmount || !openRegister) {
      toast.error('Ingresá el monto de cierre');
      return;
    }
    setIsClosing(true);
    try {
      const res = await fetch(`/api/cash-register/${openRegister.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingAmount: Number(closingAmount),
          note: closeNote,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Caja cerrada');
      setClosingAmount('');
      setCloseNote('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar caja');
    } finally {
      setIsClosing(false);
    }
  };

  const handleAddMovement = async () => {
    if (!movAmount || !openRegister) {
      toast.error('Ingresá un monto');
      return;
    }
    setIsAddingMov(true);
    try {
      const res = await fetch(`/api/cash-register/${openRegister.id}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: movType,
          amount: Number(movAmount),
          description: movDescription,
          category: movCategory,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(
        movType === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado'
      );
      setMovAmount('');
      setMovDescription('');
      setMovCategory('otro');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar movimiento');
    } finally {
      setIsAddingMov(false);
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Caja Diaria"
        description={
          openRegister
            ? 'Caja abierta — registra movimientos o cerrala'
            : 'No hay caja abierta'
        }
      />

      {!openRegister && (
        <Card className="max-w-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" /> Abrir Caja
            </CardTitle>
            <CardDescription>
              Inicia la jornada ingresando el monto en caja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 && history[0].closingAmount != null && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <DollarSign className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Si dejás el monto en blanco, se usará automáticamente el cierre
                  de la caja anterior:{' '}
                  <strong>
                    {fmt(history[0].closingAmount)}
                  </strong>
                </span>
              </div>
            )}
            {history.length === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <DollarSign className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Si dejás el monto en blanco, la caja abrirá con $0.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="openingAmount">
                Monto inicial ($){' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder={
                  history.length > 0 && history[0].closingAmount != null
                    ? history[0].closingAmount.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                      })
                    : '0.00'
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openNote">Nota (opcional)</Label>
              <Textarea
                id="openNote"
                value={openNote}
                onChange={(e) => setOpenNote(e.target.value)}
                placeholder="Detalles de apertura..."
                rows={2}
              />
            </div>
            <Button
              onClick={handleOpenCaja}
              disabled={isOpening}
              className="w-full"
            >
              {isOpening ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              Abrir Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {openRegister && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Monto Inicial</p>
                <p className="text-xl font-bold">{fmt(openRegister.openingAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" /> Ingresos
                </p>
                <p className="text-xl font-bold text-green-600">
                  {fmt(openRegister.totalIngresos)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-600" /> Egresos
                </p>
                <p className="text-xl font-bold text-red-600">
                  {fmt(openRegister.totalEgresos)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Equal className="h-3 w-3" /> Esperado en Caja
                </p>
                <p className="text-xl font-bold">
                  {fmt(openRegister.calculatedExpected)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" /> Registrar Movimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={movType}
                    onValueChange={(v) => setMovType(v as 'ingreso' | 'egreso')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monto ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={movAmount}
                    onChange={(e) => setMovAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoría</Label>
                  <Select value={movCategory} onValueChange={setMovCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOVEMENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descripción</Label>
                  <Input
                    value={movDescription}
                    onChange={(e) => setMovDescription(e.target.value)}
                    placeholder="Detalle..."
                  />
                </div>
                <Button onClick={handleAddMovement} disabled={isAddingMov}>
                  {isAddingMov ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimientos de la Caja</CardTitle>
            </CardHeader>
            <CardContent>
              {openRegister.movements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay movimientos registrados todavía
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openRegister.movements.map((mov: CashMovement) => (
                        <TableRow key={mov.id}>
                          <TableCell className="text-xs">
                            {fmtDate(mov.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                mov.type === 'egreso'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {mov.type === 'egreso' ? (
                                <ArrowDownCircle className="h-3 w-3" />
                              ) : (
                                <ArrowUpCircle className="h-3 w-3" />
                              )}
                              {mov.type === 'venta'
                                ? 'Venta'
                                : mov.type === 'ingreso'
                                  ? 'Ingreso'
                                  : 'Egreso'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {mov.category.replace('_', ' ')}
                          </TableCell>
                          <TableCell className="text-xs">
                            {mov.description || '—'}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              mov.type === 'egreso' ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {mov.type === 'egreso' ? '−' : '+'}
                            {fmt(mov.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> Cerrar Caja
              </CardTitle>
              <CardDescription>
                Monto esperado: <strong>{fmt(openRegister.calculatedExpected)}</strong>.
                Contá el efectivo real y registrá el cierre.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="closingAmount">Monto en caja real ($)</Label>
                  <Input
                    id="closingAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="closeNote">Nota de cierre (opcional)</Label>
                  <Input
                    id="closeNote"
                    value={closeNote}
                    onChange={(e) => setCloseNote(e.target.value)}
                    placeholder="Observaciones..."
                  />
                </div>
              </div>
              {closingAmount && (
                <div
                  className={`p-3 rounded-lg text-sm font-medium ${
                    Number(closingAmount) - openRegister.calculatedExpected >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Diferencia:{' '}
                  {fmt(Number(closingAmount) - openRegister.calculatedExpected)}
                  {Number(closingAmount) - openRegister.calculatedExpected < 0 &&
                    ' (faltante)'}
                  {Number(closingAmount) - openRegister.calculatedExpected > 0 &&
                    ' (sobrante)'}
                </div>
              )}
              <Button
                onClick={handleCloseCaja}
                disabled={isClosing}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {isClosing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Cerrar Caja
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Historial de Cajas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Apertura</TableHead>
                    <TableHead>Fecha Cierre</TableHead>
                    <TableHead className="text-right">Apertura</TableHead>
                    <TableHead className="text-right">Cierre</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="text-xs">
                        {fmtDate(reg.openedAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {reg.closedAt ? fmtDate(reg.closedAt) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(reg.openingAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.closingAmount != null ? fmt(reg.closingAmount) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.expectedAmount != null
                          ? fmt(reg.expectedAmount)
                          : '—'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          (reg.difference ?? 0) < 0
                            ? 'text-red-600'
                            : (reg.difference ?? 0) > 0
                              ? 'text-green-600'
                              : ''
                        }`}
                      >
                        {reg.difference != null ? fmt(reg.difference) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
