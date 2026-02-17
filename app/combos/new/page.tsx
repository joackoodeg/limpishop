'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../../components/PageHeader';

export default function NewComboPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [comboProducts, setComboProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 0,
    finalPrice: 0,
  });
  const [originalPrice, setOriginalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const total = comboProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setOriginalPrice(total);
    if (formData.discountPercentage > 0) {
      const discountedPrice = total * (1 - formData.discountPercentage / 100);
      setFormData(prev => ({ ...prev, finalPrice: Number(discountedPrice.toFixed(2)) }));
    } else {
      setFormData(prev => ({ ...prev, finalPrice: Number(total.toFixed(2)) }));
    }
  }, [comboProducts, formData.discountPercentage]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch {
      toast.error('Error al cargar productos');
    }
  };

  const addProductToCombo = (product: any) => {
    if (comboProducts.find(p => p.productId === product.id)) {
      toast.error('Este producto ya está en el combo');
      return;
    }
    const price = product.prices?.length > 0 ? product.prices[0].price : 0;
    setComboProducts([...comboProducts, { productId: product.id, productName: product.name, quantity: 1, price }]);
  };

  const updateComboProductQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) { removeProductFromCombo(productId); return; }
    setComboProducts(comboProducts.map(p => p.productId === productId ? { ...p, quantity: Number(quantity) } : p));
  };

  const removeProductFromCombo = (productId: number) => {
    setComboProducts(comboProducts.filter(p => p.productId !== productId));
  };

  const handleDiscountChange = (discountPercentage: string) => {
    const discount = Number(discountPercentage);
    setFormData(prev => ({ ...prev, discountPercentage: discount }));
    if (discount >= 0 && discount <= 100) {
      const discountedPrice = originalPrice * (1 - discount / 100);
      setFormData(prev => ({ ...prev, finalPrice: Number(discountedPrice.toFixed(2)) }));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Ingresa un nombre para el combo'); return; }
    if (comboProducts.length === 0) { toast.error('Agrega al menos un producto'); return; }
    if (formData.finalPrice <= 0) { toast.error('El precio final debe ser mayor a 0'); return; }

    setLoading(true);
    try {
      const response = await fetch('/api/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          products: comboProducts.map(p => ({ productId: p.productId, productName: p.productName, quantity: p.quantity, price: p.price })),
          originalPrice, discountPercentage: formData.discountPercentage, finalPrice: formData.finalPrice,
        }),
      });
      if (response.ok) {
        toast.success('Combo creado');
        router.push('/combos');
      } else {
        toast.error('Error al crear el combo');
      }
    } catch {
      toast.error('Error al crear el combo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Crear Nuevo Combo" actions={[{ label: 'Volver', href: '/combos', variant: 'outline' }]} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Información del Combo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Combo *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Combo Oferta Especial" required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del combo" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product selection */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Agregar Productos</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <Label>Buscar productos</Label>
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Escribe para buscar..." />
              {searchTerm && <p className="text-xs text-muted-foreground">Mostrando {filteredProducts.length} de {products.length}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 max-h-64 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-6 text-muted-foreground text-sm">
                  {searchTerm ? `Sin resultados para "${searchTerm}"` : 'No hay productos'}
                </div>
              ) : filteredProducts.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-3">
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                  {product.prices?.length > 0 && <p className="text-sm mb-2">${product.prices[0].price}</p>}
                  <Button type="button" size="sm" className="w-full" onClick={() => addProductToCombo(product)}>Agregar</Button>
                </div>
              ))}
            </div>

            {/* Selected products */}
            {comboProducts.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Productos seleccionados ({comboProducts.length})</h3>
                <div className="space-y-2">
                  {comboProducts.map((cp: any) => (
                    <div key={cp.productId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{cp.productName}</span>
                        <span className="text-xs text-muted-foreground ml-2">${cp.price}/u</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={cp.quantity}
                          onChange={(e) => updateComboProductQuantity(cp.productId, parseInt(e.target.value))}
                          className="w-20 h-8 text-center text-sm"
                        />
                        <span className="text-sm font-medium w-20 text-right">${(cp.price * cp.quantity).toFixed(2)}</span>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeProductFromCombo(cp.productId)}>×</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Precios</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio Original</Label>
                <Input value={`$${originalPrice.toFixed(2)}`} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Final</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.finalPrice}
                  onChange={(e) => setFormData({ ...formData, finalPrice: Number(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Combo'
          )}
        </Button>
      </form>
    </div>
  );
}
