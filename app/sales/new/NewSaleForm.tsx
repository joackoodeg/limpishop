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
import { Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getUnitLabel, formatStock } from '@/lib/units';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
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
}

interface ComboCartItem {
  comboId: number;
  comboName: string;
  finalPrice: number;
  quantity: number;
  products: ComboProduct[];
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
                  ${variant.price}
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
  onRemove,
}: {
  item: CartItem;
  index: number;
  onQuantityChange: (i: number, q: number) => void;
  onPriceChange: (i: number, p: number) => void;
  onRemove: (i: number) => void;
}) {
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
          <div className="font-medium text-sm mt-1">
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
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
        <p className="text-xs line-through text-muted-foreground">${combo.originalPrice.toFixed(2)}</p>
      )}
      <p className="text-sm font-semibold text-emerald-600 mb-2">${combo.finalPrice.toFixed(2)}</p>
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
  onRemove,
}: {
  item: ComboCartItem;
  index: number;
  onQuantityChange: (i: number, q: number) => void;
  onRemove: (i: number) => void;
}) {
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
            ${item.finalPrice.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <Label className="text-xs">Subtotal:</Label>
          <div className="font-medium text-sm mt-1">
            ${(item.finalPrice * item.quantity).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
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
    const productsTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const combosTotal = comboCart.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
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
                ${getFinalTotal().toFixed(2)}
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
            <>Finalizar Venta — ${getFinalTotal().toFixed(2)}</>
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
              onRemove={removeFromCart}
            />
          ))}
          {comboCart.map((item, index) => (
            <ComboCartItemRow
              key={`combo-${index}`}
              item={item}
              index={index}
              onQuantityChange={updateComboCartQuantity}
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
    </div>
  );
}
