'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PageHeader from '../../components/PageHeader';
import { getAvailableUnitOptions, getUnitLabel, getUnitShort, getStockStep } from '@/lib/units';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import { ArrowRight, ArrowLeft, Loader2, Package, DollarSign, Ruler, Scale, Droplet, Tag, Truck } from 'lucide-react';

interface Supplier { id: number; name: string; }

export default function NewProductPage() {
  const [step, setStep] = useState(1);

  // Step 1: Basic data
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unidad');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [supplierId, setSupplierId] = useState<number | null>(null);

  // Step 2: Prices
  const [prices, setPrices] = useState([{ quantity: 1, price: '' }]);
  
  const [isSaving, setIsSaving] = useState(false);
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
    return name.trim() !== '' && cost !== '' && stock !== '';
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
    const validPrices = prices.filter(p => p.price !== '' && Number(p.price) > 0);
    if (validPrices.length === 0) {
      toast.error('Agrega al menos un precio');
      return;
    }
    setIsSaving(true);
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prices: validPrices, cost, stock, description, unit, supplierId }),
      });
      toast.success('Producto creado');
      router.push('/products');
    } catch {
      toast.error('Error al crear producto');
    } finally {
      setIsSaving(false);
    }
  }

  function handlePriceChange(index: number, field: string, value: string) {
    const newPrices = [...prices];
    (newPrices[index] as any)[field] = value;
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
      <PageHeader title="Añadir Nuevo Producto" actions={[{ label: 'Volver', href: '/products', variant: 'outline' }]} />

      {/* Step indicator */}
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
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <DollarSign className="h-4 w-4" />
          2. Precios por Cantidad
        </div>
      </div>

      {/* ── Step 1: Basic data + Unit ────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Datos del Producto
            </CardTitle>
            <CardDescription>
              Primero define el producto, su unidad de medida y datos básicos. Luego podrás asignar precios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Arroz, Leche, Detergente..." required />
              </div>

              {/* Unit selection - prominent */}
              <div className="space-y-2">
                <Label>Unidad de medida</Label>
                <p className="text-xs text-muted-foreground">Selecciona cómo se mide y vende este producto</p>
                <div className={`grid gap-3 ${unitOptions.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
                  {unitOptions.map(opt => {
                    const Icon = opt.value === 'unidad' ? Package : opt.value === 'kilo' ? Scale : opt.value === 'litro' ? Droplet : Tag;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setUnit(opt.value)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          unit === opt.value
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-muted hover:border-muted-foreground/30'
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
                  <Input id="cost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock disponible ({unitShort})</Label>
                  <Input id="stock" type="number" step={getStockStep(unit)} min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles del producto..." />
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

      {/* ── Step 2: Pricing tiers ────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precios por Cantidad
              </CardTitle>
              <CardDescription>
                Define los precios de venta para distintas cantidades de <strong>{unitLabel}</strong>.
                {' '}Por ejemplo: 1 {getUnitLabel(unit, 1)} a $X, 5 {unitLabel} a $Y.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary of step 1 */}
                <div className="bg-muted/50 rounded-lg p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Producto:</span>{' '}
                    <strong>{name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unidad:</span>{' '}
                    <strong>{unitOptions.find(o => o.value === unit)?.label}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Costo:</span>{' '}
                    <strong>${cost}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>{' '}
                    <strong>{stock} {unitShort}</strong>
                  </div>
                </div>

                {/* Price tiers */}
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
                          placeholder={`Ej: ${unit === 'unidad' ? '1' : '0.5'}`}
                          value={p.quantity}
                          onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          {unitShort}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
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
                        <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => removePriceField(index)}>
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

                {/* Margin preview */}
                {prices.some(p => p.price && Number(p.price) > 0) && cost && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-sm space-y-1">
                    <p className="font-medium text-green-700 dark:text-green-400">Vista previa de márgenes</p>
                    {prices
                      .filter(p => p.price && Number(p.price) > 0)
                      .map((p, i) => {
                        const totalCost = Number(cost) * Number(p.quantity);
                        const margin = Number(p.price) - totalCost;
                        const marginPct = totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : '—';
                        return (
                          <p key={i} className="text-green-600 dark:text-green-300">
                            {p.quantity} {getUnitLabel(unit, Number(p.quantity))} → ${p.price}
                            {' '}(costo: ${totalCost.toFixed(2)}, margen: {margin >= 0 ? '+' : ''}{margin.toFixed(2)} / {marginPct}%)
                          </p>
                        );
                      })
                    }
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
                        Guardando...
                      </>
                    ) : (
                      'Guardar Producto'
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
