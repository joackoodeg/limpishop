'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getUnitLabel, getUnitShort, formatStock } from '@/lib/units';

interface Product {
  id: number;
  name: string;
  prices: { quantity: number; price: number }[];
  stock: number;
  description: string;
  unit: string;
}

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  variant: { quantity: number; price: number };
  unit: string;
}

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [searchTerm, setSearchTerm] = useState('');
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    const initialVariants: { [key: string]: number } = {};
    data.forEach((product: Product) => {
      if (product.prices && product.prices.length > 0) {
        initialVariants[product.id] = 0;
      }
    });
    setSelectedVariants(initialVariants);
  }

  function handleVariantChange(productId: number, variantIndex: number) {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantIndex }));
  }

  function addToCart(product: Product) {
    if (!product.prices || product.prices.length === 0) {
      toast.error('Este producto no tiene precios configurados');
      return;
    }
    const selectedVariantIndex = selectedVariants[product.id] || 0;
    const variant = product.prices[selectedVariantIndex];
    const existingItemIndex = cart.findIndex(
      item => item.productId === product.id && item.variant.quantity === variant.quantity
    );
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: variant.price,
        variant,
        unit: product.unit || 'unidad',
      }]);
    }
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index));
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) { removeFromCart(index); return; }
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartPrice(index: number, newPrice: number) {
    const newCart = [...cart];
    newCart[index].price = newPrice;
    setCart(newCart);
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function getCalculatedTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
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
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, paymentMethod, grandTotal: getFinalTotal() }),
      });
      if (res.ok) {
        toast.success('Venta realizada con éxito');
        setCart([]);
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <PageHeader title="Nueva Venta" actions={[{ label: 'Volver', href: '/sales', variant: 'outline' }]} />

      {/* Mobile View with Tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="productos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="productos">Productos</TabsTrigger>
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
                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{product.description}</p>
                      <p className="text-xs text-muted-foreground mb-2">Stock: {formatStock(product.stock, product.unit || 'unidad')}</p>

                      {product.prices && product.prices.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-xs">Variación:</Label>
                          <select
                            value={selectedVariants[product.id] || 0}
                            onChange={(e) => handleVariantChange(product.id, parseInt(e.target.value))}
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                          >
                            {product.prices.map((variant, index) => (
                              <option key={index} value={index}>
                                {variant.quantity} {getUnitLabel(product.unit || 'unidad', variant.quantity)} - ${variant.price}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock <= 0 ? 'Sin Stock' : 'Agregar'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carrito">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Carrito</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">El carrito está vacío</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                      {cart.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.variant.quantity} {getUnitLabel(item.unit, item.variant.quantity)}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => removeFromCart(index)}>
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
                                onChange={(e) => updateCartQuantity(index, parseInt(e.target.value) || 0)}
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
                                onChange={(e) => updateCartPrice(index, parseFloat(e.target.value) || 0)}
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
                      ))}
                    </div>

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
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                        </select>
                      </div>

                      <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isProcessing}>
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop View with 2 Columns */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Section */}
        <div>
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
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{product.description}</p>
                    <p className="text-xs text-muted-foreground mb-2">Stock: {formatStock(product.stock, product.unit || 'unidad')}</p>

                    {product.prices && product.prices.length > 0 && (
                      <div className="mb-2">
                        <Label className="text-xs">Variación:</Label>
                        <select
                          value={selectedVariants[product.id] || 0}
                          onChange={(e) => handleVariantChange(product.id, parseInt(e.target.value))}
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                        >
                          {product.prices.map((variant, index) => (
                            <option key={index} value={index}>
                              {variant.quantity} {getUnitLabel(product.unit || 'unidad', variant.quantity)} - ${variant.price}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? 'Sin Stock' : 'Agregar'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Carrito</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">El carrito está vacío</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                    {cart.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.variant.quantity} {getUnitLabel(item.unit, item.variant.quantity)}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => removeFromCart(index)}>
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
                              onChange={(e) => updateCartQuantity(index, parseInt(e.target.value) || 0)}
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
                              onChange={(e) => updateCartPrice(index, parseFloat(e.target.value) || 0)}
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
                    ))}
                  </div>

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
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isProcessing}>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
