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
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import { Loader2, Save, Building2, Plus, Trash2, Boxes, Users, DollarSign } from 'lucide-react';
import type { StoreConfig, EnabledModules } from '@/lib/types/config';
import type { CustomUnit } from '@/lib/units';

export default function ConfigPage() {
  const router = useRouter();
  const { refresh: refreshGlobalConfig } = useStoreConfig();
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New custom unit form state
  const [newUnit, setNewUnit] = useState<Omit<CustomUnit, 'id'>>({
    name: '', short: '', step: 1, lowStockThreshold: 5,
  });

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
      await refreshGlobalConfig();
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

  // Module toggle helper
  const toggleModule = (mod: keyof EnabledModules) => {
    if (!config) return;
    setConfig({
      ...config,
      enabledModules: {
        ...config.enabledModules,
        [mod]: !config.enabledModules[mod],
      },
    });
  };

  // Built-in unit toggle helper
  const toggleBuiltinUnit = (unit: string) => {
    if (!config) return;
    const units = config.allowedUnits.includes(unit)
      ? config.allowedUnits.filter(u => u !== unit)
      : [...config.allowedUnits, unit];
    // Don't allow empty — must have at least 1 unit
    if (units.length === 0 && config.customUnits.length === 0) {
      toast.error('Debe haber al menos una unidad habilitada');
      return;
    }
    setConfig({ ...config, allowedUnits: units });
  };

  // Add custom unit
  const addCustomUnit = () => {
    if (!config) return;
    if (!newUnit.name.trim() || !newUnit.short.trim()) {
      toast.error('El nombre y la abreviatura son obligatorios');
      return;
    }
    const id = newUnit.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (config.customUnits.some(cu => cu.id === id) || ['unidad', 'kilo', 'litro'].includes(id)) {
      toast.error('Ya existe una unidad con ese nombre');
      return;
    }
    setConfig({
      ...config,
      customUnits: [...config.customUnits, { ...newUnit, id }],
    });
    setNewUnit({ name: '', short: '', step: 1, lowStockThreshold: 5 });
  };

  // Remove custom unit
  const removeCustomUnit = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      customUnits: config.customUnits.filter(cu => cu.id !== id),
    });
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

  const BUILTIN_UNIT_DEFS = [
    { value: 'unidad', label: 'Unidad (uds)' },
    { value: 'kilo', label: 'Kilogramo (kg)' },
    { value: 'litro', label: 'Litro (L)' },
  ];

  const MODULE_DEFS: { key: keyof EnabledModules; label: string; description: string; icon: typeof DollarSign }[] = [
    { key: 'cajaDiaria', label: 'Caja Diaria', description: 'Apertura/cierre de caja, ingresos y egresos manuales', icon: DollarSign },
    { key: 'empleados', label: 'Empleados', description: 'Gestión de empleados y asignación a ventas', icon: Users },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Configuración del Local"
        description="Gestiona la información de tu negocio, módulos y unidades"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* ── Información del negocio ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Negocio</CardTitle>
            <CardDescription>
              Esta información se mostrará en reportes, PDFs y documentos generados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>

        {/* ── Módulos activables ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Módulos
            </CardTitle>
            <CardDescription>
              Activa o desactiva funcionalidades adicionales según las necesidades de tu negocio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MODULE_DEFS.map((mod) => (
              <label
                key={mod.key}
                className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <mod.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{mod.label}</p>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={config.enabledModules[mod.key]}
                    onChange={() => toggleModule(mod.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* ── Unidades de medida ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Unidades de Medida</CardTitle>
            <CardDescription>
              Configura qué unidades están disponibles para tus productos. Puedes deshabilitar las predefinidas y crear las tuyas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Built-in units */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Unidades predefinidas</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BUILTIN_UNIT_DEFS.map((u) => (
                  <label
                    key={u.value}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={config.allowedUnits.includes(u.value)}
                      onChange={() => toggleBuiltinUnit(u.value)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{u.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom units list */}
            {config.customUnits.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Unidades personalizadas</Label>
                <div className="space-y-2">
                  {config.customUnits.map((cu) => (
                    <div key={cu.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{cu.name}</span>
                        <span className="text-sm text-muted-foreground">({cu.short})</span>
                        <span className="text-xs text-muted-foreground">
                          step: {cu.step} | stock bajo: {cu.lowStockThreshold}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomUnit(cu.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom unit form */}
            <div className="border rounded-lg p-4 space-y-4">
              <Label className="text-sm font-medium">Agregar unidad personalizada</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="cu-name" className="text-xs text-muted-foreground">Nombre *</Label>
                  <Input
                    id="cu-name"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    placeholder="Ej: Docena"
                  />
                </div>
                <div>
                  <Label htmlFor="cu-short" className="text-xs text-muted-foreground">Abreviatura *</Label>
                  <Input
                    id="cu-short"
                    value={newUnit.short}
                    onChange={(e) => setNewUnit({ ...newUnit, short: e.target.value })}
                    placeholder="Ej: doc"
                  />
                </div>
                <div>
                  <Label htmlFor="cu-step" className="text-xs text-muted-foreground">Step</Label>
                  <Input
                    id="cu-step"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newUnit.step}
                    onChange={(e) => setNewUnit({ ...newUnit, step: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="cu-threshold" className="text-xs text-muted-foreground">Stock bajo</Label>
                  <Input
                    id="cu-threshold"
                    type="number"
                    min="0"
                    step="1"
                    value={newUnit.lowStockThreshold}
                    onChange={(e) => setNewUnit({ ...newUnit, lowStockThreshold: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCustomUnit}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Unidad
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Botones de acción ───────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
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
    </div>
  );
}
