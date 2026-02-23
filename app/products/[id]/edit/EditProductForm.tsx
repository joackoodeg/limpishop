'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PageHeader from '../../../components/PageHeader';
import { getAvailableUnitOptions, getUnitLabel, getUnitShort, getStockStep } from '@/lib/units';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import { formatPrice } from '@/lib/utils';
import { ArrowRight, ArrowLeft, Loader2, Package, DollarSign, Ruler, Scale, Droplet, Boxes, Tag, Truck } from 'lucide-react';

interface Supplier { id: number; name: string; }

export interface ProductForEdit {
  id: number;
  name: string;
  prices: { quantity: number; price: number }[];
  cost?: number | string;
  stock: number | string;
  description?: string;
  unit: string;
  active?: boolean;
  featured?: boolean;
  categoryId?: number | null;
  supplierId?: number | null;
}

export default function EditProductForm({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct: ProductForEdit;
}) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(initialProduct.name);
  const [unit, setUnit] = useState(initialProduct.unit || 'unidad');
  const [cost, setCost] = useState(String(initialProduct.cost ?? ''));
  const [stock, setStock] = useState(String(initialProduct.stock));
  const [description, setDescription] = useState(initialProduct.description ?? '');
  const [active, setActive] = useState(initialProduct.active ?? true);
  const [featured, setFeatured] = useState(initialProduct.featured ?? false);
  const [categoryId, setCategoryId] = useState<number | null>(initialProduct.categoryId ?? null);
  const [supplierId, setSupplierId] = useState<number | null>(initialProduct.supplierId ?? null);
  const [prices, setPrices] = useState(
    initialProduct.prices?.length > 0
      ? initialProduct.prices.map((p) => ({ quantity: p.quantity, price: String(p.price) }))
      : [{ quantity: 1, price: '' }]
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const router = useRouter();
  const { allowedUnits, customUnits, isModuleEnabled } = useStoreConfig();
  const unitOptions = getAvailableUnitOptions(allowedUnits, customUnits);
  const proveedoresEnabled = isModuleEnabled('proveedores');

  useEffect(() => {
    if (!proveedoresEnabled) return;
    fetch('/api/suppliers')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));
  }, [proveedoresEnabled]);

  function canAdvance() {
    return name.trim() !== '' && cost !== '';
  }

  function goToStep2() {
    if (!canAdvance()) {
      toast.error('Completa nombre, costo y stock antes de continuar');
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validPrices = prices.filter((p) => p.price !== '' && Number(p.price) > 0);
    if (validPrices.length === 0) {
      toast.error('Agrega al menos un precio');
      return;
    }
    setIsSaving(true);
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          prices: validPrices.map((p) => ({ quantity: Number(p.quantity), price: Number(p.price) })),
          cost,
          description,
          active,
          featured,
          categoryId,
          unit,
          supplierId,
        }),
      });
      toast.success('Producto actualizado');
      router.push('/products');
    } catch {
      toast.error('Error al actualizar producto');
    } finally {
      setIsSaving(false);
    }
  }

  function handlePriceChange(index: number, field: string, value: string) {
    const newPrices = [...prices];
    if (field === 'quantity') {
      newPrices[index] = { ...newPrices[index], quantity: value === '' ? 0 : Number(value), price: newPrices[index].price };
    } else {
      newPrices[index] = { ...newPrices[index], price: value };
    }
    setPrices(newPrices);
  }

  function addPriceField() {
    setPrices([...prices, { quantity: 1, price: '' }]);
  }

  function removePriceField(index: number) {
    setPrices(prices.filter((_, i) => i !== index));
  }

  const unitLabel = getUnitLabel(unit, 2);
  const unitShort = getUnitShort(unit);

  return (
    <div>
      <PageHeader title="Editar Producto" actions={[{ label: 'Volver', href: '/products', variant: 'outline' }]} />

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          <Package className="h-4 w-4" />
          1. Producto y Unidad
        </button>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          <DollarSign className="h-4 w-4" />
          2. Precios por Cantidad
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Datos del Producto
            </CardTitle>
            <CardDescription>
              Modifica los datos básicos del producto y su unidad de medida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Arroz, Leche, Detergente..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Unidad de medida</Label>
                <p className="text-xs text-muted-foreground">Selecciona cómo se mide y vende este producto</p>
                <div
                  className={`grid gap-3 ${unitOptions.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}
                >
                  {unitOptions.map((opt) => {
                    const Icon =
                      opt.value === 'unidad' ? Package : opt.value === 'kilo' ? Scale : opt.value === 'litro' ? Droplet : Tag;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setUnit(opt.value)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          unit === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-center">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="font-medium text-sm">{opt.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo unitario (por {getUnitLabel(unit, 1)})</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock actual ({unitShort})</Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {stock} {unitShort}
                    </span>
                    <Link
                      href={`/stock?product=${id}`}
                      className="ml-auto text-xs text-primary hover:underline font-medium"
                    >
                      Gestionar stock →
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">El stock se gestiona desde el panel de Stock</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles del producto..."
                />
              </div>

              {proveedoresEnabled && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Proveedor (opcional)
                  </Label>
                  <p className="text-xs text-muted-foreground">Asocia este producto a un proveedor</p>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={supplierId ?? ''}
                    onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">— Sin proveedor —</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={goToStep2} disabled={!canAdvance()}>
                  Continuar a Precios
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precios por Cantidad
              </CardTitle>
              <CardDescription>
                Define los precios de venta para distintas cantidades de <strong>{unitLabel}</strong>. Por ejemplo: 1{' '}
                {getUnitLabel(unit, 1)} a $X, 5 {unitLabel} a $Y.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Producto:</span> <strong>{name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unidad:</span>{' '}
                    <strong>{unitOptions.find((o) => o.value === unit)?.label}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Costo:</span> <strong>{formatPrice(Number(cost))}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>{' '}
                    <strong>
                      {stock} {unitShort}
                    </strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                    <span>Cantidad ({unitLabel})</span>
                    <span>Precio de venta ($)</span>
                    <span className="w-9"></span>
                  </div>
                  {prices.map((p, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <div className="relative">
                        <Input
                          type="number"
                          step={getStockStep(unit)}
                          min="0.01"
                          placeholder={unit === 'unidad' ? '1' : '0.5'}
                          value={p.quantity}
                          onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          {unitShort}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={p.price}
                          onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                          className="pl-7"
                          required
                        />
                      </div>
                      {prices.length > 1 ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => removePriceField(index)}
                        >
                          ×
                        </Button>
                      ) : (
                        <div className="w-9" />
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addPriceField}>
                    + Añadir otro precio
                  </Button>
                </div>

                {prices.some((p) => p.price && Number(p.price) > 0) && cost && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-sm space-y-1">
                    <p className="font-medium text-green-700 dark:text-green-400">Vista previa de márgenes</p>
                    {prices
                      .filter((p) => p.price && Number(p.price) > 0)
                      .map((p, i) => {
                        const totalCost = Number(cost) * Number(p.quantity);
                        const margin = Number(p.price) - totalCost;
                        const marginPct = totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : '—';
                        return (
                          <p key={i} className="text-green-600 dark:text-green-300">
                            {p.quantity} {getUnitLabel(unit, Number(p.quantity))} → {formatPrice(Number(p.price))} (costo: {formatPrice(totalCost)}, margen: {margin >= 0 ? '+' : ''}
                            {formatPrice(margin)} / {marginPct}%)
                          </p>
                        );
                      })}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Producto'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
