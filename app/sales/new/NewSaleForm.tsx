'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getUnitLabel, formatStock } from '@/lib/units';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/data/products';
import type { ActiveEmployee } from '@/lib/data/employees';
import type { Combo, ComboProduct } from '@/lib/data/combos';

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  variant: { quantity: number; price: number };
  unit: string;
  discountType: 'descuento' | 'recarga' | null;
  discountPercent: number;
}

interface ComboCartItem {
  comboId: number;
  comboName: string;
  finalPrice: number;
  quantity: number;
  products: ComboProduct[];
  discountType: 'descuento' | 'recarga' | null;
  discountPercent: number;
}

// ─── Effective price helper ───────────────────────────────────────────────────
function getEffectivePrice(
  price: number,
  discountType: 'descuento' | 'recarga' | null,
  discountPercent: number,
): number {
  if (!discountType || discountPercent === 0) return price;
  return discountType === 'descuento'
    ? price * (1 - discountPercent / 100)
    : price * (1 + discountPercent / 100);
}

interface CurrentUser {
  role: string;
  employeeId: number | null;
  employeeName: string | null;
}

interface NewSaleFormProps {
  products: Product[];
  employees: ActiveEmployee[];
  combos: Combo[];
}

// ─── Payment badge colours ────────────────────────────────────────────────────
const PAYMENT_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
];

// ─── Product card (shared between mobile/desktop) ─────────────────────────────
function ProductCard({
  product,
  variantIndex,
  onVariantChange,
  onAdd,
}: {
  product: Product;
  variantIndex: number;
  onVariantChange: (idx: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="border rounded-lg p-3">
      <h3 className="font-semibold text-sm">{product.name}</h3>
      <p className="text-xs text-muted-foreground mb-1">{product.description}</p>
      <p className="text-xs text-muted-foreground mb-2">
        Stock: {formatStock(product.stock, product.unit || 'unidad')}
      </p>

      {product.prices && product.prices.length > 0 && (
        <div className="mb-2">
          <Label className="text-xs">Variación:</Label>
          <Select
            value={String(variantIndex)}
            onValueChange={(v) => onVariantChange(Number(v))}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {product.prices.map((variant, index) => (
                <SelectItem key={index} value={String(index)} className="text-xs">
                  {variant.quantity} {getUnitLabel(product.unit || 'unidad', variant.quantity)} —
                  {formatPrice(variant.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={onAdd}
        disabled={product.stock <= 0}
      >
        {product.stock <= 0 ? 'Sin Stock' : 'Agregar'}
      </Button>
    </div>
  );
}

// ─── Cart item row ─────────────────────────────────────────────────────────────
function CartItemRow({
  item,
  index,
  onQuantityChange,
  onPriceChange,
  onDiscountChange,
  onRemove,
}: {
  item: CartItem;
  index: number;
  onQuantityChange: (i: number, q: number) => void;
  onPriceChange: (i: number, p: number) => void;
  onDiscountChange: (i: number, type: 'descuento' | 'recarga' | null, percent: number) => void;
  onRemove: (i: number) => void;
}) {
  const effectivePrice = getEffectivePrice(item.price, item.discountType, item.discountPercent);
  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-medium text-sm">{item.name}</h4>
          <p className="text-xs text-muted-foreground">
            {item.variant.quantity} {getUnitLabel(item.unit, item.variant.quantity)}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive h-7 w-7 p-0"
          onClick={() => onRemove(index)}
        >
          ×
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div>
          <Label className="text-xs">Cant:</Label>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 0)}
            className="h-8 text-center text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Precio:</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.price}
            onChange={(e) => onPriceChange(index, parseFloat(e.target.value) || 0)}
            className="h-8 text-center text-xs"
          />
        </div>
        <div className="text-center">
          <Label className="text-xs">Subtotal:</Label>
          {item.discountType && item.discountPercent > 0 ? (
            <div className="mt-1">
              <div className="text-xs line-through text-muted-foreground">
                {formatPrice(item.price * item.quantity)}
              </div>
              <div
                className={cn(
                  'font-medium text-sm',
                  item.discountType === 'descuento' ? 'text-red-600' : 'text-blue-600',
                )}
              >
                {formatPrice(effectivePrice * item.quantity)}
              </div>
            </div>
          ) : (
            <div className="font-medium text-sm mt-1">
              {formatPrice(effectivePrice * item.quantity)}
            </div>
          )}
        </div>
      </div>
      {/* Descuento / recarga por ítem */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <Label className="text-xs shrink-0 text-muted-foreground">Aj.%:</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              onDiscountChange(
                index,
                item.discountType === 'descuento' ? null : 'descuento',
                item.discountPercent,
              )
            }
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors',
              item.discountType === 'descuento'
                ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300'
                : 'border-muted-foreground/30 text-muted-foreground hover:border-red-300 hover:text-red-600',
            )}
          >
            Desc.
          </button>
          <button
            type="button"
            onClick={() =>
              onDiscountChange(
                index,
                item.discountType === 'recarga' ? null : 'recarga',
                item.discountPercent,
              )
            }
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors',
              item.discountType === 'recarga'
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                : 'border-muted-foreground/30 text-muted-foreground hover:border-blue-300 hover:text-blue-600',
            )}
          >
            Rec.
          </button>
        </div>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.5"
          placeholder="0"
          value={item.discountPercent > 0 ? item.discountPercent : ''}
          onChange={(e) =>
            onDiscountChange(
              index,
              item.discountType ?? 'descuento',
              parseFloat(e.target.value) || 0,
            )
          }
          className="h-7 text-center text-xs w-16"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

// ─── Combo card ───────────────────────────────────────────────────────────────
function ComboCard({
  combo,
  onAdd,
}: {
  combo: Combo;
  onAdd: () => void;
}) {
  return (
    <div className="border rounded-lg p-3">
      <h3 className="font-semibold text-sm">{combo.name}</h3>
      {combo.description && (
        <p className="text-xs text-muted-foreground mb-1">{combo.description}</p>
      )}
      <p className="text-xs text-muted-foreground mb-2">
        {combo.products.map((p) => `${p.productName} ×${p.quantity}`).join(' · ')}
      </p>
      {combo.discountPercentage > 0 && (
        <p className="text-xs line-through text-muted-foreground">{formatPrice(combo.originalPrice)}</p>
      )}
      <p className="text-sm font-semibold text-emerald-600 mb-2">{formatPrice(combo.finalPrice)}</p>
      <Button size="sm" className="w-full" onClick={onAdd}>
        Agregar Combo
      </Button>
    </div>
  );
}

// ─── Combo cart item row ──────────────────────────────────────────────────────
function ComboCartItemRow({
  item,
  index,
  onQuantityChange,
  onDiscountChange,
  onRemove,
}: {
  item: ComboCartItem;
  index: number;
  onQuantityChange: (i: number, q: number) => void;
  onDiscountChange: (i: number, type: 'descuento' | 'recarga' | null, percent: number) => void;
  onRemove: (i: number) => void;
}) {
  const effectivePrice = getEffectivePrice(item.finalPrice, item.discountType, item.discountPercent);
  return (
    <div className="p-3 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded px-1.5 py-0.5 font-medium">Combo</span>
            <h4 className="font-medium text-sm">{item.comboName}</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.products.map((p) => `${p.productName} ×${p.quantity}`).join(' · ')}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive h-7 w-7 p-0"
          onClick={() => onRemove(index)}
        >
          ×
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div>
          <Label className="text-xs">Cant:</Label>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 0)}
            className="h-8 text-center text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Precio:</Label>
          <div className="h-8 flex items-center justify-center font-medium text-sm">
            {formatPrice(item.finalPrice)}
          </div>
        </div>
        <div className="text-center">
          <Label className="text-xs">Subtotal:</Label>
          {item.discountType && item.discountPercent > 0 ? (
            <div className="mt-1">
              <div className="text-xs line-through text-muted-foreground">
                {formatPrice(item.finalPrice * item.quantity)}
              </div>
              <div
                className={cn(
                  'font-medium text-sm',
                  item.discountType === 'descuento' ? 'text-red-600' : 'text-blue-600',
                )}
              >
                {formatPrice(effectivePrice * item.quantity)}
              </div>
            </div>
          ) : (
            <div className="font-medium text-sm mt-1">
              {formatPrice(effectivePrice * item.quantity)}
            </div>
          )}
        </div>
      </div>
      {/* Descuento / recarga por ítem */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <Label className="text-xs shrink-0 text-muted-foreground">Aj.%:</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              onDiscountChange(
                index,
                item.discountType === 'descuento' ? null : 'descuento',
                item.discountPercent,
              )
            }
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors',
              item.discountType === 'descuento'
                ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300'
                : 'border-muted-foreground/30 text-muted-foreground hover:border-red-300 hover:text-red-600',
            )}
          >
            Desc.
          </button>
          <button
            type="button"
            onClick={() =>
              onDiscountChange(
                index,
                item.discountType === 'recarga' ? null : 'recarga',
                item.discountPercent,
              )
            }
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors',
              item.discountType === 'recarga'
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                : 'border-muted-foreground/30 text-muted-foreground hover:border-blue-300 hover:text-blue-600',
            )}
          >
            Rec.
          </button>
        </div>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.5"
          placeholder="0"
          value={item.discountPercent > 0 ? item.discountPercent : ''}
          onChange={(e) =>
            onDiscountChange(
              index,
              item.discountType ?? 'descuento',
              parseFloat(e.target.value) || 0,
            )
          }
          className="h-7 text-center text-xs w-16"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

// ─── Discount / surcharge global modal ───────────────────────────────────────
interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  comboCart: ComboCartItem[];
  onApply: (
    productIndexes: number[],
    comboIndexes: number[],
    type: 'descuento' | 'recarga',
    percent: number,
  ) => void;
  onClear: (productIndexes: number[], comboIndexes: number[]) => void;
}

function DiscountModal({ open, onOpenChange, cart, comboCart, onApply, onClear }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'descuento' | 'recarga'>('descuento');
  const [percent, setPercent] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      const all = new Set<string>();
      cart.forEach((_, i) => all.add(`p-${i}`));
      comboCart.forEach((_, i) => all.add(`c-${i}`));
      setSelected(all);
    }
  }, [open, cart, comboCart]);

  function toggleItem(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === cart.length + comboCart.length) {
      setSelected(new Set());
    } else {
      const all = new Set<string>();
      cart.forEach((_, i) => all.add(`p-${i}`));
      comboCart.forEach((_, i) => all.add(`c-${i}`));
      setSelected(all);
    }
  }

  function handleApply() {
    const pct = parseFloat(percent);
    if (isNaN(pct) || pct <= 0 || pct > 100) return;
    const productIndexes = cart.map((_, i) => i).filter((i) => selected.has(`p-${i}`));
    const comboIndexes = comboCart.map((_, i) => i).filter((i) => selected.has(`c-${i}`));
    onApply(productIndexes, comboIndexes, discountType, pct);
    onOpenChange(false);
    setPercent('');
  }

  function handleClear() {
    const productIndexes = cart.map((_, i) => i).filter((i) => selected.has(`p-${i}`));
    const comboIndexes = comboCart.map((_, i) => i).filter((i) => selected.has(`c-${i}`));
    onClear(productIndexes, comboIndexes);
    onOpenChange(false);
  }

  const allSelected = selected.size === cart.length + comboCart.length;
  const percentNum = parseFloat(percent);
  const canApply = !isNaN(percentNum) && percentNum > 0 && percentNum <= 100 && selected.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Descuento / Recarga Global</DialogTitle>
          <DialogDescription>
            Aplicar un porcentaje a los ítems seleccionados del carrito.
          </DialogDescription>
        </DialogHeader>

        {/* Tipo */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDiscountType('descuento')}
            className={cn(
              'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
              discountType === 'descuento'
                ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300'
                : 'border-border text-muted-foreground hover:border-red-300',
            )}
          >
            📉 Descuento
          </button>
          <button
            type="button"
            onClick={() => setDiscountType('recarga')}
            className={cn(
              'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
              discountType === 'recarga'
                ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                : 'border-border text-muted-foreground hover:border-blue-300',
            )}
          >
            📈 Recarga
          </button>
        </div>

        {/* Porcentaje */}
        <div className="flex items-center gap-2">
          <Label className="shrink-0">Porcentaje:</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="ej: 10"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="text-center"
            autoFocus
          />
          <span className="text-sm font-medium">%</span>
        </div>

        {/* Selección de ítems */}
        <div className="border rounded-lg p-3 space-y-2 max-h-52 overflow-y-auto">
          <label className="flex items-center gap-2 cursor-pointer pb-1 border-b">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">Seleccionar todos</span>
          </label>
          {cart.map((item, i) => (
            <label key={`p-${i}`} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(`p-${i}`)}
                onChange={() => toggleItem(`p-${i}`)}
                className="h-4 w-4 rounded accent-primary"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatPrice(item.price)} × {item.quantity}
                  {item.discountType && item.discountPercent > 0 && (
                    <span
                      className={cn(
                        'ml-1',
                        item.discountType === 'descuento' ? 'text-red-500' : 'text-blue-500',
                      )}
                    >
                      ({item.discountType === 'descuento' ? '-' : '+'}{item.discountPercent}%)
                    </span>
                  )}
                </span>
              </div>
            </label>
          ))}
          {comboCart.map((item, i) => (
            <label key={`c-${i}`} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(`c-${i}`)}
                onChange={() => toggleItem(`c-${i}`)}
                className="h-4 w-4 rounded accent-primary"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded px-1 mr-1">
                    Combo
                  </span>
                  {item.comboName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatPrice(item.finalPrice)} × {item.quantity}
                  {item.discountType && item.discountPercent > 0 && (
                    <span
                      className={cn(
                        'ml-1',
                        item.discountType === 'descuento' ? 'text-red-500' : 'text-blue-500',
                      )}
                    >
                      ({item.discountType === 'descuento' ? '-' : '+'}{item.discountPercent}%)
                    </span>
                  )}
                </span>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={handleClear} disabled={selected.size === 0}>
            Limpiar ajuste
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!canApply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function NewSaleForm({ products, employees, combos }: NewSaleFormProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [searchTerm, setSearchTerm] = useState('');
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    products.forEach((p) => { init[p.id] = 0; });
    return init;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [comboCart, setComboCart] = useState<ComboCartItem[]>([]);
  const [comboSearchTerm, setComboSearchTerm] = useState('');
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const router = useRouter();
  const { isModuleEnabled } = useStoreConfig();

  const isEmployee = currentUser !== null && currentUser.role !== 'admin';

  // Only the auth/me fetch remains client-side (JWT cookie-based, cannot read on server)
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setCurrentUser({
            role: data.role,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
          });
          if (data.role !== 'admin' && data.employeeId) {
            setSelectedEmployee(data.employeeId);
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  function handleVariantChange(productId: number, variantIndex: number) {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantIndex }));
  }

  function addToCart(product: Product) {
    if (!product.prices || product.prices.length === 0) {
      toast.error('Este producto no tiene precios configurados');
      return;
    }
    const variantIdx = selectedVariants[product.id] ?? 0;
    const variant = product.prices[variantIdx];
    const existingIdx = cart.findIndex(
      (item) => item.productId === product.id && item.variant.quantity === variant.quantity,
    );
    if (existingIdx >= 0) {
      setCart((prev) => {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        return next;
      });
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: variant.price,
          variant,
          unit: product.unit || 'unidad',
          discountType: null,
          discountPercent: 0,
        },
      ]);
    }
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) { removeFromCart(index); return; }
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: newQuantity };
      return next;
    });
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartPrice(index: number, newPrice: number) {
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], price: newPrice };
      return next;
    });
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartDiscount(
    index: number,
    type: 'descuento' | 'recarga' | null,
    percent: number,
  ) {
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], discountType: type, discountPercent: percent };
      return next;
    });
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateComboDiscount(
    index: number,
    type: 'descuento' | 'recarga' | null,
    percent: number,
  ) {
    setComboCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], discountType: type, discountPercent: percent };
      return next;
    });
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  // ── Combo cart helpers ──────────────────────────────────────────────────────
  function addComboToCart(combo: Combo) {
    setComboCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.comboId === combo.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          comboId: combo.id,
          comboName: combo.name,
          finalPrice: combo.finalPrice,
          quantity: 1,
          products: combo.products,
          discountType: null,
          discountPercent: 0,
        },
      ];
    });
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function removeComboFromCart(index: number) {
    setComboCart((prev) => prev.filter((_, i) => i !== index));
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateComboCartQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) { removeComboFromCart(index); return; }
    setComboCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: newQuantity };
      return next;
    });
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function getCalculatedTotal() {
    const productsTotal = cart.reduce(
      (total, item) =>
        total + getEffectivePrice(item.price, item.discountType, item.discountPercent) * item.quantity,
      0,
    );
    const combosTotal = comboCart.reduce(
      (total, item) =>
        total + getEffectivePrice(item.finalPrice, item.discountType, item.discountPercent) * item.quantity,
      0,
    );
    return productsTotal + combosTotal;
  }

  function getFinalTotal() {
    return customTotal !== null ? customTotal : getCalculatedTotal();
  }

  function handleTotalEdit() {
    if (isEditingTotal) {
      setIsEditingTotal(false);
    } else {
      setCustomTotal(getCalculatedTotal());
      setIsEditingTotal(true);
    }
  }

  async function handleCheckout() {
    if (cart.length === 0 && comboCart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          comboItems: comboCart,
          paymentMethod,
          grandTotal: getFinalTotal(),
          employeeId: selectedEmployee || undefined,
          employeeName: selectedEmployee
            ? isEmployee
              ? (currentUser?.employeeName ?? undefined)
              : employees.find((e) => e.id === selectedEmployee)?.name
            : undefined,
        }),
      });
      if (res.ok) {
        toast.success('Venta realizada con éxito');
        setCart([]);
        setComboCart([]);
        setCustomTotal(null);
        setIsEditingTotal(false);
        router.push('/sales');
      } else {
        const error = await res.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch {
      toast.error('Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredCombos = combos.filter((c) =>
    c.name.toLowerCase().includes(comboSearchTerm.toLowerCase()),
  );
  const totalCartItems =
    cart.reduce((sum, item) => sum + item.quantity, 0) +
    comboCart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Shared checkout panel ─────────────────────────────────────────────────────
  function CheckoutPanel() {
    return (
      <div className="border-t pt-4 space-y-3">
        {/* Descuento / recarga global */}
        {(cart.length > 0 || comboCart.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm"
            onClick={() => setIsDiscountModalOpen(true)}
          >
            % Descuento / Recarga
          </Button>
        )}

        {/* Total */}
        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <span className="text-lg font-semibold">Total:</span>
          <div className="flex items-center gap-2">
            {isEditingTotal ? (
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customTotal || 0}
                onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 0)}
                className="h-9 text-center font-bold w-28"
              />
            ) : (
              <span className="text-xl font-bold text-emerald-600">
                {formatPrice(getFinalTotal())}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={handleTotalEdit}>
              {isEditingTotal ? '✓' : 'Editar'}
            </Button>
          </div>
        </div>

        {customTotal !== null && customTotal !== getCalculatedTotal() && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            💡 Precio especial aplicado
          </div>
        )}

        {/* Payment method */}
        <div>
          <Label className="text-sm">Método de Pago:</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employee selector */}
        {isModuleEnabled('empleados') && (isEmployee || employees.length > 0) && (
          <div>
            <Label className="text-sm">Vendedor:</Label>
            {isEmployee ? (
              <div className="mt-1 px-3 py-2 text-sm rounded-md border bg-muted text-muted-foreground">
                {currentUser?.employeeName ?? 'Empleado'}
              </div>
            ) : (
              <Select
                value={selectedEmployee ? String(selectedEmployee) : 'unassigned'}
                onValueChange={(v) =>
                  setSelectedEmployee(v === 'unassigned' ? null : Number(v))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                      {emp.role ? ` (${emp.role})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando venta...
            </>
          ) : (
            <>Finalizar Venta — {formatPrice(getFinalTotal())}</>
          )}
        </Button>
      </div>
    );
  }

  // ── Products list panel ───────────────────────────────────────────────────────
  function ProductsPanel() {
    return (
      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variantIndex={selectedVariants[product.id] ?? 0}
            onVariantChange={(idx) => handleVariantChange(product.id, idx)}
            onAdd={() => addToCart(product)}
          />
        ))}
        {filteredProducts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No se encontraron productos
          </p>
        )}
      </div>
    );
  }

  // ── Combos list panel ────────────────────────────────────────────────────────
  function CombosPanel() {
    return (
      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
        {filteredCombos.map((combo) => (
          <ComboCard
            key={combo.id}
            combo={combo}
            onAdd={() => addComboToCart(combo)}
          />
        ))}
        {filteredCombos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No se encontraron combos
          </p>
        )}
      </div>
    );
  }

  // ── Cart panel ────────────────────────────────────────────────────────────────
  function CartPanel() {
    const isEmpty = cart.length === 0 && comboCart.length === 0;
    return isEmpty ? (
      <p className="text-muted-foreground text-sm text-center py-8">El carrito está vacío</p>
    ) : (
      <>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
          {cart.map((item, index) => (
            <CartItemRow
              key={`prod-${index}`}
              item={item}
              index={index}
              onQuantityChange={updateCartQuantity}
              onPriceChange={updateCartPrice}
              onDiscountChange={updateCartDiscount}
              onRemove={removeFromCart}
            />
          ))}
          {comboCart.map((item, index) => (
            <ComboCartItemRow
              key={`combo-${index}`}
              item={item}
              index={index}
              onQuantityChange={updateComboCartQuantity}
              onDiscountChange={updateComboDiscount}
              onRemove={removeComboFromCart}
            />
          ))}
        </div>
        <CheckoutPanel />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Nueva Venta"
        actions={[{ label: 'Volver', href: '/sales', variant: 'outline' }]}
      />

      {/* Mobile — Tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="productos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="combos">Combos</TabsTrigger>
            <TabsTrigger value="carrito">
              Carrito {totalCartItems > 0 && `(${totalCartItems})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="productos">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Productos</CardTitle>
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CardHeader>
              <CardContent>
                <ProductsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combos">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Combos</CardTitle>
                <Input
                  type="text"
                  placeholder="Buscar combos..."
                  value={comboSearchTerm}
                  onChange={(e) => setComboSearchTerm(e.target.value)}
                />
              </CardHeader>
              <CardContent>
                <CombosPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carrito">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Carrito</CardTitle>
              </CardHeader>
              <CardContent>
                <CartPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop — 2 columns */}
      <div className="hidden lg:grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <Tabs defaultValue="productos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="combos">Combos</TabsTrigger>
              </TabsList>
              <TabsContent value="productos" className="mt-3 space-y-3">
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ProductsPanel />
              </TabsContent>
              <TabsContent value="combos" className="mt-3 space-y-3">
                <Input
                  type="text"
                  placeholder="Buscar combos..."
                  value={comboSearchTerm}
                  onChange={(e) => setComboSearchTerm(e.target.value)}
                />
                <CombosPanel />
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Carrito</CardTitle>
          </CardHeader>
          <CardContent>
            <CartPanel />
          </CardContent>
        </Card>
      </div>

      <DiscountModal
        open={isDiscountModalOpen}
        onOpenChange={setIsDiscountModalOpen}
        cart={cart}
        comboCart={comboCart}
        onApply={(productIndexes, comboIndexes, type, percent) => {
          productIndexes.forEach((i) => updateCartDiscount(i, type, percent));
          comboIndexes.forEach((i) => updateComboDiscount(i, type, percent));
        }}
        onClear={(productIndexes, comboIndexes) => {
          productIndexes.forEach((i) => updateCartDiscount(i, null, 0));
          comboIndexes.forEach((i) => updateComboDiscount(i, null, 0));
        }}
      />
    </div>
  );
}
