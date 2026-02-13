'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PageHeader from '../../components/PageHeader';

export default function NewProductPage() {
  const [name, setName] = useState('');
  const [prices, setPrices] = useState([{ quantity: 1, price: '' }]);
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prices, cost, stock, description }),
    });
    toast.success('Producto creado');
    router.push('/products');
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

  return (
    <div>
      <PageHeader title="Añadir Nuevo Producto" actions={[{ label: 'Volver', href: '/products', variant: 'outline' }]} />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Precios</Label>
              {prices.map((p, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={p.quantity}
                    onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                    className="w-1/3"
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={p.price}
                    onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                    className="w-1/3"
                    required
                  />
                  {prices.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removePriceField(index)}>
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPriceField}>
                + Añadir Precio
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo Unitario</Label>
                <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
