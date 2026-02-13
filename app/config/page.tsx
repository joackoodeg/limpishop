'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageHeader from '@/app/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/app/components/ImageUpload';
import { Loader2, Save, Building2 } from 'lucide-react';

interface StoreConfig {
  id: number;
  storeName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  taxId: string;
}

export default function ConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar configuración actual
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Error al cargar configuración');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Error al guardar');

      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUploaded = async (data: any) => {
    setConfig(prev => prev ? {
      ...prev,
      logoUrl: data.imageUrl,
      logoPublicId: data.imagePublicId,
    } : null);
    toast.success('Logo actualizado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No se pudo cargar la configuración</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Configuración del Local"
        description="Gestiona la información de tu negocio"
        icon={Building2}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Información del Negocio</CardTitle>
          <CardDescription>
            Esta información se mostrará en reportes, PDFs y documentos generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo del negocio */}
            <div className="space-y-2">
              <Label>Logo del Negocio</Label>
              <ImageUpload
                currentImage={config.logoUrl}
                onImageUploaded={handleImageUploaded}
                entityType="config"
                entityId={config.id}
              />
            </div>

            {/* Nombre del negocio */}
            <div className="space-y-2">
              <Label htmlFor="storeName">Nombre del Negocio *</Label>
              <Input
                id="storeName"
                value={config.storeName}
                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                required
                placeholder="Ej: Mi Tienda"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                placeholder="Ej: +595 21 123456"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="Ej: contacto@minegocio.com"
              />
            </div>

            {/* RUC / CUIT / Tax ID */}
            <div className="space-y-2">
              <Label htmlFor="taxId">RUC / CUIT / Tax ID</Label>
              <Input
                id="taxId"
                value={config.taxId}
                onChange={(e) => setConfig({ ...config, taxId: e.target.value })}
                placeholder="Ej: 12345678-9"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                placeholder="Ej: Av. Principal 1234"
                rows={2}
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={config.city}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                placeholder="Ej: Asunción"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
