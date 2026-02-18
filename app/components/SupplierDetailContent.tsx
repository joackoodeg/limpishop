'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageHeader from './PageHeader';
import ConfirmDialog from './ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  DollarSign,
  Package,
  FileText,
  Save,
  CreditCard,
  Banknote,
  ArrowRightLeft,
} from 'lucide-react';
import { useStoreConfig } from './StoreConfigProvider';
import type { Supplier, SupplierProduct, SupplierPayment, SupplierBalance } from '@/lib/data/suppliers';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'transferencia', label: 'Transferencia', icon: ArrowRightLeft },
];

interface SupplierDetailContentProps {
  supplier: Supplier;
  initialProducts: SupplierProduct[];
  initialPayments: SupplierPayment[];
  initialBalance: SupplierBalance;
}

export function SupplierDetailContent({
  supplier,
  initialProducts,
  initialPayments,
  initialBalance,
}: SupplierDetailContentProps) {
  const router = useRouter();
  const { isModuleEnabled } = useStoreConfig();

  // ── Info State ──────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState(supplier.name);
  const [formContact, setFormContact] = useState(supplier.contactName);
  const [formPhone, setFormPhone] = useState(supplier.phone);
  const [formEmail, setFormEmail] = useState(supplier.email);
  const [formAddress, setFormAddress] = useState(supplier.address);
  const [formCity, setFormCity] = useState(supplier.city);
  const [formTaxId, setFormTaxId] = useState(supplier.taxId);
  const [formNotes, setFormNotes] = useState(supplier.notes);

  // ── Products State ─────────────────────────────────────────────────
  const [productsList, setProductsList] = useState(initialProducts);
  const [allProducts, setAllProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productCost, setProductCost] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  // ── Payments State ─────────────────────────────────────────────────
  const [paymentsList, setPaymentsList] = useState(initialPayments);
  const [balance, setBalance] = useState(initialBalance);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('efectivo');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [payRegisterCaja, setPayRegisterCaja] = useState(true);
  const [isPayingSaving, setIsPayingSaving] = useState(false);
  const [cajaOpen, setCajaOpen] = useState(false);

  // ── Load products for selector ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllProducts(data.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  // ── Check if caja is open ──────────────────────────────────────────
  useEffect(() => {
    if (isModuleEnabled('cajaDiaria')) {
      fetch('/api/cash-register')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCajaOpen(data.some((r: { status: string }) => r.status === 'open'));
          }
        })
        .catch(() => {});
    }
  }, [isModuleEnabled]);

  // ── Info handlers ──────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          contactName: formContact,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          city: formCity,
          taxId: formTaxId,
          notes: formNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Proveedor actualizado');
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Product handlers ───────────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!selectedProductId) {
      toast.error('Seleccioná un producto');
      return;
    }
    setIsAddingProduct(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(selectedProductId),
          cost: productCost ? parseFloat(productCost) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Producto asociado');
      setSelectedProductId('');
      setProductCost('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al asociar producto');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleRemoveProduct = async () => {
    if (!deleteProductId) return;
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/products?spId=${deleteProductId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Producto desasociado');
      setDeleteProductId(null);
      router.refresh();
    } catch {
      toast.error('Error al desasociar producto');
    }
  };

  // ── Payment handlers ───────────────────────────────────────────────
  const handlePayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    setIsPayingSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: payMethod,
          date: payDate ? new Date(payDate).toISOString() : undefined,
          note: payNote,
          registerInCaja: payRegisterCaja && cajaOpen && isModuleEnabled('cajaDiaria'),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Pago registrado');
      setPayAmount('');
      setPayNote('');
      setPayDate(new Date().toISOString().split('T')[0]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setIsPayingSaving(false);
    }
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  // Available products = allProducts minus already associated
  const associatedProductIds = new Set(productsList.map((p) => p.productId));
  const availableProducts = allProducts.filter((p) => !associatedProductIds.has(p.id));

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/proveedores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            {supplier.contactName && `Contacto: ${supplier.contactName}`}
            {supplier.contactName && supplier.phone && ' · '}
            {supplier.phone && `Tel: ${supplier.phone}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-1">
            <FileText className="h-4 w-4" /> Información
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1">
            <Package className="h-4 w-4" /> Productos ({productsList.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> Pagos ({paymentsList.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Información ─────────────────────────────────────────── */}
        <TabsContent value="info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Datos del proveedor</CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre / Razón social *</Label>
                      <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Persona de contacto</Label>
                      <Input value={formContact} onChange={(e) => setFormContact(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>CUIT / RUC</Label>
                      <Input value={formTaxId} onChange={(e) => setFormTaxId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Dirección</Label>
                      <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Notas</Label>
                      <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveInfo} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre</p>
                    <p className="font-medium">{supplier.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contacto</p>
                    <p className="font-medium">{supplier.contactName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{supplier.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{supplier.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CUIT / RUC</p>
                    <p className="font-medium">{supplier.taxId || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ciudad</p>
                    <p className="font-medium">{supplier.city || '—'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Dirección</p>
                    <p className="font-medium">{supplier.address || '—'}</p>
                  </div>
                  {supplier.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">Notas</p>
                      <p className="font-medium">{supplier.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Productos ───────────────────────────────────────────── */}
        <TabsContent value="products">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Asociar Producto</CardTitle>
              <CardDescription>Seleccioná un producto que provee este proveedor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-40">
                  <Input
                    type="number"
                    placeholder="Costo (opcional)"
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button onClick={handleAddProduct} disabled={isAddingProduct || !selectedProductId}>
                  {isAddingProduct ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  Asociar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {productsList.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay productos asociados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Costo de compra</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsList.map((sp) => (
                      <TableRow key={sp.id}>
                        <TableCell className="font-medium">{sp.productName}</TableCell>
                        <TableCell>{sp.cost ? formatCurrency(sp.cost) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteProductId(sp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {deleteProductId && (
            <ConfirmDialog
              open={!!deleteProductId}
              onOpenChange={(open) => !open && setDeleteProductId(null)}
              title="Desasociar Producto"
              description="¿Estás seguro de que querés quitar este producto del proveedor?"
              onConfirm={handleRemoveProduct}
              variant="destructive"
            />
          )}
        </TabsContent>

        {/* ── Tab: Pagos ───────────────────────────────────────────────── */}
        <TabsContent value="payments">
          {/* Balance summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total deuda</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(balance.totalDebt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total pagado</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(balance.totalPaid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className={`text-2xl font-bold ${balance.balance > 0 ? 'text-red-600' : balance.balance < 0 ? 'text-green-600' : ''}`}>
                  {formatCurrency(Math.abs(balance.balance))}
                  {balance.balance > 0 ? ' (Debemos)' : balance.balance < 0 ? ' (A favor)' : ' (Al día)'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* New payment form */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Registrar Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nota</Label>
                  <Input
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Referencia, factura, etc."
                  />
                </div>
                {isModuleEnabled('cajaDiaria') && (
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="registerCaja"
                      checked={payRegisterCaja && cajaOpen}
                      onChange={(e) => setPayRegisterCaja(e.target.checked)}
                      disabled={!cajaOpen}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="registerCaja" className="text-sm cursor-pointer">
                      Registrar como egreso en Caja Diaria
                      {!cajaOpen && (
                        <span className="text-muted-foreground ml-1">(No hay caja abierta)</span>
                      )}
                    </Label>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button onClick={handlePayment} disabled={isPayingSaving || !payAmount}>
                  {isPayingSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-1" />
                  )}
                  Registrar Pago
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsList.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay pagos registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Caja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsList.map((pay) => (
                      <TableRow key={pay.id}>
                        <TableCell className="text-sm">{formatDate(pay.date)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(pay.amount)}</TableCell>
                        <TableCell className="text-sm capitalize">{pay.paymentMethod}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{pay.note || '—'}</TableCell>
                        <TableCell>
                          {pay.cashMovementId ? (
                            <Badge variant="secondary">Registrado</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
