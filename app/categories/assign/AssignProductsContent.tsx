'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, Check, X, Package, ArrowRight, ArrowLeft, CheckCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Product {
  id: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string;
}

export default function AssignProductsContent({
  initialCategories,
  initialProducts,
}: {
  initialCategories: Category[];
  initialProducts: Product[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategories.length > 0 ? initialCategories[0].id : null
  );
  const [searchAssigned, setSearchAssigned] = useState('');
  const [searchUnassigned, setSearchUnassigned] = useState('');
  const [selectedToAssign, setSelectedToAssign] = useState<Set<number>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<number>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function fetchData() {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);
      const [catData, prodData] = await Promise.all([catRes.json(), prodRes.json()]);
      setCategories(catData);
      setProducts(prodData);
    } catch {
      toast.error('Error al cargar datos');
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const assignedProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products
      .filter((p) => p.categoryId === selectedCategoryId)
      .filter(
        (p) => !searchAssigned || p.name.toLowerCase().includes(searchAssigned.toLowerCase())
      );
  }, [products, selectedCategoryId, searchAssigned]);

  const unassignedProducts = useMemo(() => {
    return products
      .filter((p) => !p.categoryId)
      .filter(
        (p) => !searchUnassigned || p.name.toLowerCase().includes(searchUnassigned.toLowerCase())
      );
  }, [products, searchUnassigned]);

  const otherCategoryProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products
      .filter((p) => p.categoryId && p.categoryId !== selectedCategoryId)
      .filter(
        (p) => !searchUnassigned || p.name.toLowerCase().includes(searchUnassigned.toLowerCase())
      );
  }, [products, selectedCategoryId, searchUnassigned]);

  const categoryProductCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const p of products) {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  const unassignedCount = useMemo(() => products.filter((p) => !p.categoryId).length, [products]);

  const toggleSelectToAssign = (productId: number) => {
    setSelectedToAssign((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectToRemove = (productId: number) => {
    setSelectedToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const selectAllUnassigned = () => {
    if (selectedToAssign.size === unassignedProducts.length) {
      setSelectedToAssign(new Set());
    } else {
      setSelectedToAssign(new Set(unassignedProducts.map((p) => p.id)));
    }
  };

  const selectAllAssigned = () => {
    if (selectedToRemove.size === assignedProducts.length) {
      setSelectedToRemove(new Set());
    } else {
      setSelectedToRemove(new Set(assignedProducts.map((p) => p.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedCategoryId || selectedToAssign.size === 0) return;
    setAssigning(true);
    try {
      const response = await fetch(`/api/categories/${selectedCategoryId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedToAssign) }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedToAssign(new Set());
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al asignar productos');
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkRemove = async () => {
    if (!selectedCategoryId || selectedToRemove.size === 0) return;
    setRemoving(true);
    try {
      const response = await fetch(`/api/categories/${selectedCategoryId}/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedToRemove) }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedToRemove(new Set());
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al remover productos');
    } finally {
      setRemoving(false);
    }
  };

  const handleMoveFromOtherCategory = async (productId: number) => {
    if (!selectedCategoryId) return;
    try {
      const response = await fetch(`/api/categories/${selectedCategoryId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId] }),
      });
      if (response.ok) {
        toast.success('Producto movido');
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.error);
      }
    } catch {
      toast.error('Error al mover producto');
    }
  };

  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedToAssign(new Set());
    setSelectedToRemove(new Set());
    setSearchAssigned('');
    setSearchUnassigned('');
  };

  return (
    <div>
      <PageHeader
        title="Asignar Productos a Categorías"
        description={
          selectedCategory
            ? `Administra los productos de "${selectedCategory.name}"`
            : 'Selecciona una categoría'
        }
        actions={[{ label: 'Volver a Categorías', href: '/categories', variant: 'outline' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Categorías
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSelectCategory(category.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${
                      selectedCategoryId === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <span className="truncate">{category.name}</span>
                    <Badge
                      variant={selectedCategoryId === category.id ? 'secondary' : 'outline'}
                      className="ml-2 flex-shrink-0 text-xs"
                    >
                      {categoryProductCounts[category.id] || 0}
                    </Badge>
                  </button>
                ))}
              </div>
              {unassignedCount > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    <Package className="h-3 w-3 inline mr-1" />
                    {unassignedCount} producto{unassignedCount !== 1 ? 's' : ''} sin categoría
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Productos en &ldquo;{selectedCategory?.name}&rdquo;</h3>
                  <Badge variant="secondary">{assignedProducts.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {assignedProducts.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllAssigned}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      {selectedToRemove.size === assignedProducts.length
                        ? 'Deseleccionar'
                        : 'Seleccionar todo'}
                    </Button>
                  )}
                  {selectedToRemove.size > 0 && (
                    <ConfirmDialog
                      description={`¿Quitar ${selectedToRemove.size} producto(s) de "${selectedCategory?.name}"?`}
                      onConfirm={handleBulkRemove}
                      confirmLabel="Quitar"
                    >
                      <Button size="sm" variant="destructive" disabled={removing}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Quitar ({selectedToRemove.size})
                      </Button>
                    </ConfirmDialog>
                  )}
                </div>
              </div>

              {assignedProducts.length > 5 && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en esta categoría..."
                    value={searchAssigned}
                    onChange={(e) => setSearchAssigned(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
              )}

              {assignedProducts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay productos en esta categoría</p>
                  <p className="text-xs mt-1">Selecciona productos disponibles abajo para asignarlos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
                  {assignedProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => toggleSelectToRemove(product.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                        selectedToRemove.has(product.id)
                          ? 'bg-destructive/10 border border-destructive/30 text-destructive'
                          : 'bg-muted/50 hover:bg-muted border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                          selectedToRemove.has(product.id)
                            ? 'bg-destructive border-destructive text-white'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {selectedToRemove.has(product.id) && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Productos Disponibles</h3>
                  <Badge variant="outline">{unassignedProducts.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {unassignedProducts.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllUnassigned}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      {selectedToAssign.size === unassignedProducts.length
                        ? 'Deseleccionar'
                        : 'Seleccionar todo'}
                    </Button>
                  )}
                  {selectedToAssign.size > 0 && (
                    <Button size="sm" onClick={handleBulkAssign} disabled={assigning}>
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Asignar ({selectedToAssign.size})
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto disponible..."
                  value={searchUnassigned}
                  onChange={(e) => setSearchUnassigned(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>

              {unassignedProducts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchUnassigned
                      ? 'No se encontraron productos'
                      : 'Todos los productos están asignados a una categoría'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
                  {unassignedProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => toggleSelectToAssign(product.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                        selectedToAssign.has(product.id)
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'bg-muted/50 hover:bg-muted border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                          selectedToAssign.has(product.id)
                            ? 'bg-primary border-primary text-white'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {selectedToAssign.has(product.id) && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {otherCategoryProducts.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-muted-foreground">
                    Productos en Otras Categorías
                  </h3>
                  <Badge variant="outline">{otherCategoryProducts.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Puedes mover estos productos a &ldquo;{selectedCategory?.name}&rdquo; (se quitarán
                  de su categoría actual)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {otherCategoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-sm bg-muted/30 border border-transparent"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{product.name}</span>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          {product.categoryName}
                        </Badge>
                      </div>
                      <ConfirmDialog
                        description={`¿Mover "${product.name}" de "${product.categoryName}" a "${selectedCategory?.name}"?`}
                        onConfirm={() => handleMoveFromOtherCategory(product.id)}
                        confirmLabel="Mover"
                        variant="default"
                      >
                        <Button size="sm" variant="ghost" className="flex-shrink-0 h-7 px-2">
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
