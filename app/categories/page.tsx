'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryImage from '../components/CategoryImage';
import ImageUpload from '../components/ImageUpload';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showImageUpload, setShowImageUpload] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch {
      toast.error('Error al cargar categorías');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

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
        fetchCategories();
        toast.success('Categoría creada');
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
        body: JSON.stringify({ name: editingCategory.name, description: editingCategory.description }),
      });
      if (response.ok) {
        setEditingCategory(null);
        fetchCategories();
        toast.success('Categoría actualizada');
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al actualizar categoría');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCategories();
        fetchProducts();
        toast.success('Categoría eliminada');
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al eliminar categoría');
    }
  };

  const handleAssignProductToCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedCategoryId) return;
    try {
      const product = products.find((p: any) => String(p.id) === selectedProductId);
      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, categoryId: selectedCategoryId }),
      });
      if (response.ok) {
        fetchProducts();
        setSelectedProductId('');
        setSelectedCategoryId('');
        toast.success('Producto asignado');
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al asignar producto');
    }
  };

  const handleRemoveProductFromCategory = async (productId: number) => {
    try {
      const product = products.find((p: any) => p.id === productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, categoryId: null }),
      });
      if (response.ok) {
        fetchProducts();
        toast.success('Producto removido de categoría');
      }
    } catch {
      toast.error('Error al remover producto');
    }
  };

  const handleImageUploaded = (data: any) => {
    setCategories(prev => prev.map(cat => cat.id === data.category.id ? data.category : cat));
  };

  const toggleImageUpload = (categoryId: number) => {
    setShowImageUpload(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-4 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gestión de Categorías" />

      {/* Create / Edit category */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editingCategory ? editingCategory.name : newCategory.name}
                onChange={(e) => editingCategory
                  ? setEditingCategory({ ...editingCategory, name: e.target.value })
                  : setNewCategory({ ...newCategory, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={editingCategory ? editingCategory.description : newCategory.description}
                onChange={(e) => editingCategory
                  ? setEditingCategory({ ...editingCategory, description: e.target.value })
                  : setNewCategory({ ...newCategory, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingCategory ? 'Actualizar' : 'Crear'}</Button>
              {editingCategory && (
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories list */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Categorías Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay categorías creadas</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      {category.description && <p className="text-sm text-muted-foreground mt-1">{category.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleImageUpload(category.id)}>
                        <ImagePlus className="h-4 w-4" aria-hidden="true" />
                        {category.imageUrl ? 'Cambiar img' : 'Agregar img'}
                      </Button>
                      <Button size="sm" variant="warning" onClick={() => setEditingCategory(category)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Button>
                      <ConfirmDialog
                        description="¿Estás seguro de que quieres eliminar esta categoría?"
                        onConfirm={() => handleDeleteCategory(category.id)}
                        confirmLabel="Eliminar"
                      >
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Eliminar
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CategoryImage category={category} width={120} height={120} className="flex-shrink-0" />
                    {showImageUpload[category.id] && (
                      <ImageUpload
                        entityType="category"
                        entityId={category.id}
                        currentImage={category.imageUrl}
                        onImageUploaded={handleImageUploaded}
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign products */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Asignar Producto a Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssignProductToCategory} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.categoryName && `(${product.categoryName})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" variant="secondary">Asignar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Products by category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Productos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.map((category) => {
            const categoryProducts = products.filter((p: any) => p.categoryId === category.id);
            return (
              <div key={category.id} className="mb-6">
                <h3 className="font-medium mb-2">{category.name} ({categoryProducts.length} productos)</h3>
                {categoryProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm ml-4">Sin productos en esta categoría</p>
                ) : (
                  <div className="ml-4 space-y-1">
                    {categoryProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{product.name}</span>
                        <ConfirmDialog
                          description="¿Quitar este producto de su categoría?"
                          onConfirm={() => handleRemoveProductFromCategory(product.id)}
                          confirmLabel="Quitar"
                        >
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            Quitar
                          </Button>
                        </ConfirmDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">
              Sin Categoría ({products.filter((p: any) => !p.categoryId).length} productos)
            </h3>
            <div className="ml-4 space-y-1">
              {products.filter((p: any) => !p.categoryId).map((product: any) => (
                <div key={product.id} className="p-2 bg-muted rounded text-sm">{product.name}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
