'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { toast } from 'sonner';

export default function ComboDetailPage() {
  const params = useParams();
  const [combo, setCombo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchCombo();
  }, [params.id]);

  const fetchCombo = async () => {
    try {
      const response = await fetch(`/api/combos/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCombo(data);
      }
    } catch {
      toast.error('Error al cargar combo');
    } finally {
      setLoading(false);
    }
  };

  const toggleComboStatus = async () => {
    try {
      const response = await fetch(`/api/combos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...combo, active: !combo.active }),
      });
      if (response.ok) {
        setCombo((prev: any) => ({ ...prev, active: !prev.active }));
        toast.success('Estado actualizado');
      }
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="pt-6 space-y-4"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold mb-4">Combo no encontrado</h1>
        <Button asChild><Link href="/combos">Volver a Combos</Link></Button>
      </div>
    );
  }

  const savings = combo.originalPrice - combo.finalPrice;

  return (
    <div>
      <PageHeader title="Detalles del Combo">
        <Button variant="outline" asChild><Link href="/combos">Volver</Link></Button>
        <Button variant="secondary" asChild><Link href={`/combos/${combo.id}/edit`}>Editar</Link></Button>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">
        {/* Basic info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{combo.name}</h2>
                {combo.description && <p className="text-muted-foreground mt-1">{combo.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge type={combo.active ? 'active' : 'inactive'} />
                <Button
                  size="sm"
                  variant={combo.active ? 'secondary' : 'default'}
                  onClick={toggleComboStatus}
                >
                  {combo.active ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </div>

            {/* Price cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">${combo.originalPrice?.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Precio Original</div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{combo.discountPercentage}%</div>
                <div className="text-sm text-amber-800">Descuento</div>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">${combo.finalPrice?.toFixed(2)}</div>
                <div className="text-sm text-emerald-800">Precio Final</div>
              </div>
            </div>

            {savings > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <p className="text-emerald-800 font-medium">¡Ahorro de ${savings.toFixed(2)} con este combo!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos incluidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {combo.products?.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">{product.productName}</h4>
                    <p className="text-sm text-muted-foreground">Precio: ${product.price?.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{product.quantity}</div>
                    <div className="text-xs text-muted-foreground">{product.quantity === 1 ? 'unidad' : 'unidades'}</div>
                  </div>
                  <div className="text-right font-semibold">${(product.price * product.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Creado:</span>{' '}
                {new Date(combo.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {combo.updatedAt && (
                <div>
                  <span className="text-muted-foreground">Actualizado:</span>{' '}
                  {new Date(combo.updatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Total productos:</span> {combo.products?.length || 0}
              </div>
              <div>
                <span className="text-muted-foreground">Total unidades:</span>{' '}
                {combo.products?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
