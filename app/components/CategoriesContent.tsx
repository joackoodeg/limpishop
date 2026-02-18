'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Pencil, Trash2, Tags } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PageHeader from './PageHeader';
import ConfirmDialog from './ConfirmDialog';
import CategoryImage from './CategoryImage';
import ImageUpload from './ImageUpload';
import type { Category } from '@/lib/data/products';

interface CategoriesContentProps {
  initialCategories: Category[];
}

export function CategoriesContent({ initialCategories }: CategoriesContentProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<Record<number, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      if (response.ok) {
        setNewCategory({ name: '', description: '' });
        toast.success('Categoría creada');
        router.refresh();
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al crear categoría');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description ?? '',
        }),
      });
      if (response.ok) {
        setEditingCategory(null);
        toast.success('Categoría actualizada');
        router.refresh();
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al actualizar categoría');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setDeletingId(categoryId);
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Categoría eliminada');
        router.refresh();
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al eliminar categoría');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageUploaded = (data: { category: Category }) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === data.category.id ? data.category : cat))
    );
  };

  const toggleImageUpload = (categoryId: number) => {
    setShowImageUpload((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <div>
      <PageHeader
        title="Gestión de Categorías"
        description="Crea y administra las categorías de productos"
        actions={[{ label: 'Asignar Productos', href: '/categories/assign', variant: 'secondary' }]}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <form
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editingCategory ? editingCategory.name : newCategory.name}
                onChange={(e) =>
                  editingCategory
                    ? setEditingCategory({ ...editingCategory, name: e.target.value })
                    : setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder="Ej: Frutas, Lácteos, Electrónica..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={
                  editingCategory
                    ? (editingCategory.description ?? '')
                    : newCategory.description
                }
                onChange={(e) =>
                  editingCategory
                    ? setEditingCategory({ ...editingCategory, description: e.target.value })
                    : setNewCategory({ ...newCategory, description: e.target.value })
                }
                placeholder="Descripción breve de la categoría"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingCategory ? 'Actualizar' : 'Crear Categoría'}
              </Button>
              {editingCategory && (
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Tags className="h-10 w-10 text-muted-foreground mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold">No hay categorías</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crea tu primera categoría usando el formulario de arriba
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4 flex-1">
                    <CategoryImage
                      category={category}
                      width={80}
                      height={80}
                      className="flex-shrink-0 rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold text-base">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleImageUpload(category.id)}
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline ml-1">
                        {category.imageUrl ? 'Cambiar img' : 'Imagen'}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => setEditingCategory(category)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </Button>
                    <ConfirmDialog
                      description="¿Estás seguro de que quieres eliminar esta categoría? Los productos asignados quedarán sin categoría."
                      onConfirm={() => handleDeleteCategory(category.id)}
                      confirmLabel="Eliminar"
                    >
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === category.id}
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline ml-1">Eliminar</span>
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
                {showImageUpload[category.id] && (
                  <ImageUpload
                    entityType="category"
                    entityId={category.id}
                    currentImage={category.imageUrl}
                    onImageUploaded={handleImageUploaded}
                    className="mt-3"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
