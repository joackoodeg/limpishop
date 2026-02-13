'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, Package, Search, Star, StarOff } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge, { stockStatus, stockLabel } from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

interface Price {
  quantity: number;
  price: number;
}

interface Product {
  id: number;
  name: string;
  prices: Price[];
  stock: number;
  description: string;
  active: boolean;
  featured: boolean;
  categoryName?: string;
  categoryId?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    active: 'all',
    stock: 'all',
    category: 'all',
    featured: 'all'
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function handleDelete(productId: number) {
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    toast.success('Producto eliminado');
    fetchProducts();
  }

  async function handleToggleActive(productId: number) {
    try {
      const res = await fetch(`/api/products/${productId}/toggle-active`, { method: 'PATCH' });
      if (res.ok) {
        fetchProducts();
        toast.success('Estado actualizado');
      }
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  async function handleToggleFeatured(productId: number) {
    try {
      const res = await fetch(`/api/products/${productId}/toggle-featured`, { method: 'PATCH' });
      if (res.ok) {
        fetchProducts();
        toast.success('Destacado actualizado');
      }
    } catch {
      toast.error('Error al actualizar destacado');
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesActive = filters.active === 'all' ||
      (filters.active === 'active' && product.active) ||
      (filters.active === 'inactive' && !product.active);
    let matchesStock = true;
    if (filters.stock === 'inStock') matchesStock = product.stock > 5;
    else if (filters.stock === 'lowStock') matchesStock = product.stock > 0 && product.stock <= 5;
    else if (filters.stock === 'outOfStock') matchesStock = product.stock === 0;
    const matchesCategory = filters.category === 'all' ||
      String(product.categoryId) === filters.category ||
      (filters.category === 'uncategorized' && !product.categoryId);
    const matchesFeatured = filters.featured === 'all' ||
      (filters.featured === 'featured' && product.featured) ||
      (filters.featured === 'notFeatured' && !product.featured);
    return matchesQuery && matchesActive && matchesStock && matchesCategory && matchesFeatured;
  });

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({ active: 'all', stock: 'all', category: 'all', featured: 'all' });
    setQuery('');
  };

  return (
    <div>
      <PageHeader title="Productos">
        <Button variant="outline" onClick={clearFilters}>Limpiar Filtros</Button>
        <Button variant="secondary" asChild>
          <Link href="/sales/new">Realizar Venta</Link>
        </Button>
        <Button asChild>
          <Link href="/products/new">Agregar Producto</Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <Input
        type="text"
        placeholder="Buscar productos por nombre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium mb-3">Filtros</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <select
              value={filters.stock}
              onChange={(e) => handleFilterChange('stock', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Stock: Todos</option>
              <option value="inStock">En Stock (&gt;5)</option>
              <option value="lowStock">Poco Stock (1-5)</option>
              <option value="outOfStock">Sin Stock (0)</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Categoría: Todas</option>
              <option value="uncategorized">Sin Categoría</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Destacado: Todos</option>
              <option value="featured">Destacados</option>
              <option value="notFeatured">No destacados</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Mostrando {filteredProducts.length} de {products.length} productos
          </p>
        </CardContent>
      </Card>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Products grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={`relative ${!product.active ? 'opacity-60' : ''}`}>
              <CardContent className="pt-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <StatusBadge type={product.active ? 'active' : 'inactive'} />
                  {product.featured && <StatusBadge type="featured" />}
                  <StatusBadge type={stockStatus(product.stock)} label={stockLabel(product.stock)} />
                </div>

                {/* Name & category */}
                <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
                {product.categoryName && (
                  <p className="text-sm text-primary flex items-center gap-1">
                    <Folder className="h-4 w-4" aria-hidden="true" />
                    {product.categoryName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>

                {/* Prices */}
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Precios:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.prices?.map((p, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                        {p.quantity} → ${p.price}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap mt-4">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/products/${product.id}`}>Ver</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/products/${product.id}/edit`}>Editar</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={product.active ? 'secondary' : 'default'}
                    onClick={() => handleToggleActive(product.id)}
                  >
                    {product.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant={product.featured ? 'secondary' : 'outline'}
                    onClick={() => handleToggleFeatured(product.id)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {product.featured ? (
                        <>
                          <StarOff className="h-4 w-4" aria-hidden="true" />
                          Quitar destacado
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4" aria-hidden="true" />
                          Destacar
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && products.length > 0 && (
        <EmptyState
          icon={<Search className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
          title="No se encontraron productos"
          description="Prueba ajustando los filtros"
          actionLabel="Limpiar filtros"
          onAction={clearFilters}
        />
      )}

      {!loading && products.length === 0 && (
        <EmptyState
          icon={<Package className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
          title="No hay productos registrados"
          description="Comienza agregando tu primer producto"
          actionLabel="Agregar Producto"
          actionHref="/products/new"
        />
      )}
    </div>
  );
}
