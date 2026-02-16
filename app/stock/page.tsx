'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import PageHeader from '../components/PageHeader';
import StatusBadge, { movementBadgeType, movementLabel, stockStatus, stockLabel } from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatStock, getUnitShort, getLowStockThreshold } from '@/lib/units';
import { Boxes, PackagePlus, AlertTriangle, ArrowDownUp, TrendingUp, TrendingDown } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  stock: number;
  unit: string;
}

interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string;
  referenceId: number | null;
  createdAt: string;
}

export default function StockPage() {
  return (
    <Suspense fallback={
      <div>
        <PageHeader title="Gestión de Stock" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    }>
      <StockPageContent />
    </Suspense>
  );
}

function StockPageContent() {
  const searchParams = useSearchParams();
  const preselectedProduct = searchParams.get('product');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>(preselectedProduct || '');
  const [movementType, setMovementType] = useState<'reposicion' | 'ajuste'>('reposicion');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Filters
  const [filterProduct, setFilterProduct] = useState<string>(preselectedProduct || '');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProductId(preselectedProduct);
      setFilterProduct(preselectedProduct);
    }
  }, [preselectedProduct]);

  async function fetchData() {
    try {
      const [prodRes, movRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stock'),
      ]);
      const prodData = await prodRes.json();
      const movData = await movRes.json();
      setProducts(prodData);
      setMovements(movData);
    } catch (e) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Selecciona un producto');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty === 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    if (movementType === 'reposicion' && qty <= 0) {
      toast.error('La cantidad de reposición debe ser positiva');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(selectedProductId),
          quantity: qty,
          type: movementType,
          note,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          movementType === 'reposicion'
            ? `Stock repuesto: ${data.product.name} → ${data.product.stock}`
            : `Ajuste registrado: ${data.product.name} → ${data.product.stock}`
        );
        setQuantity('');
        setNote('');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al registrar movimiento');
      }
    } catch {
      toast.error('Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  }

  // Low stock products
  const lowStockProducts = products.filter(p => {
    const threshold = getLowStockThreshold(p.unit || 'unidad');
    return p.stock > 0 && p.stock <= threshold;
  });

  const outOfStockProducts = products.filter(p => p.stock <= 0);

  // Filter movements
  const filteredMovements = movements.filter(m => {
    const matchProduct = filterProduct === '' || String(m.productId) === filterProduct;
    const matchType = filterType === 'all' || m.type === filterType;
    return matchProduct && matchType;
  });

  const {
    paginatedItems, currentPage, pageSize, totalPages,
    totalItems, pageSizeOptions, itemRange, hasNextPage, hasPrevPage,
    goToPage, setPageSize,
  } = usePagination(filteredMovements, { defaultPageSize: 20 });

  // Filtered product list for the form dropdown
  const filteredProductsForSearch = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const selectedProduct = products.find(p => String(p.id) === selectedProductId);

  if (loading) {
    return (
      <div>
        <PageHeader title="Gestión de Stock" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gestión de Stock">
        <Button variant="outline" asChild>
          <Link href="/products">Ver Productos</Link>
        </Button>
      </PageHeader>

      {/* ── Alerts: Low Stock / Out of Stock ── */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-3 mb-6">
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Productos agotados ({outOfStockProducts.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outOfStockProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProductId(String(p.id)); setMovementType('reposicion'); }}
                      className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    Stock bajo ({lowStockProducts.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProductId(String(p.id)); setMovementType('reposicion'); }}
                      className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                    >
                      {p.name} ({formatStock(p.stock, p.unit || 'unidad')})
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Form: Add Stock Movement ── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Registrar Movimiento de Stock
          </CardTitle>
          <CardDescription>
            Agrega una reposición de mercadería o registra un ajuste por inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product selector */}
              <div className="space-y-2">
                <Label>Producto</Label>
                <Input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="mb-2"
                />
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {filteredProductsForSearch.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Stock: {formatStock(p.stock, p.unit || 'unidad')}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Stock actual: <strong>{formatStock(selectedProduct.stock, selectedProduct.unit || 'unidad')}</strong>
                  </p>
                )}
              </div>

              {/* Type + Quantity */}
              <div className="space-y-2">
                <Label>Tipo de movimiento</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('reposicion')}
                    className={`p-3 rounded-lg border-2 text-center transition-all text-sm ${
                      movementType === 'reposicion'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                    <div className="font-medium">Reposición</div>
                    <div className="text-xs text-muted-foreground">Agregar stock</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('ajuste')}
                    className={`p-3 rounded-lg border-2 text-center transition-all text-sm ${
                      movementType === 'ajuste'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 ring-1 ring-orange-500'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <ArrowDownUp className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                    <div className="font-medium">Ajuste</div>
                    <div className="text-xs text-muted-foreground">Corregir stock</div>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="quantity">
                    Cantidad {movementType === 'ajuste' ? '(positivo suma, negativo resta)' : ''}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min={movementType === 'reposicion' ? '0.01' : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={movementType === 'reposicion' ? 'Ej: 20' : 'Ej: -3 o 5'}
                    required
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Nota (opcional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Pedido proveedor ABC, ajuste por inventario físico..."
                  rows={2}
                />
              </div>
            </div>

            {/* Preview */}
            {selectedProduct && quantity && parseFloat(quantity) !== 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">Vista previa: </span>
                <strong>{selectedProduct.name}</strong>
                {' '}— {formatStock(selectedProduct.stock, selectedProduct.unit || 'unidad')}
                {' → '}
                <strong>
                  {formatStock(
                    Math.max(0, selectedProduct.stock + parseFloat(quantity || '0')),
                    selectedProduct.unit || 'unidad'
                  )}
                </strong>
                {' '}
                <span className={parseFloat(quantity) > 0 ? 'text-emerald-600' : 'text-red-600'}>
                  ({parseFloat(quantity) > 0 ? '+' : ''}{quantity} {getUnitShort(selectedProduct.unit || 'unidad')})
                </span>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Registrando...' : 'Registrar Movimiento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── History Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Historial de Movimientos
          </CardTitle>
          <CardDescription>
            Registro completo de entradas, salidas y ajustes de stock.
          </CardDescription>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <Label className="text-xs">Producto</Label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
              >
                <option value="">Todos los productos</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
              >
                <option value="all">Todos</option>
                <option value="inicial">Inicial</option>
                <option value="reposicion">Reposición</option>
                <option value="venta">Venta</option>
                <option value="ajuste">Ajuste</option>
                <option value="devolucion">Devolución</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFilterProduct(''); setFilterType('all'); }}
                className="h-8"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <EmptyState
              icon={<Boxes className="h-10 w-10 text-muted-foreground" />}
              title="Sin movimientos"
              description="No hay movimientos de stock que coincidan con los filtros."
            />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {paginatedItems.map((m) => (
                  <div key={m.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{m.productName}</span>
                      <StatusBadge type={movementBadgeType(m.type)} label={movementLabel(m.type)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block">Cantidad</span>
                        <span className={`font-medium ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </span>
                      </div>
                      <div>
                        <span className="block">Anterior</span>
                        <span className="font-medium text-foreground">{m.previousStock}</span>
                      </div>
                      <div>
                        <span className="block">Nuevo</span>
                        <span className="font-medium text-foreground">{m.newStock}</span>
                      </div>
                    </div>
                    {m.note && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">{m.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Stock Ant.</TableHead>
                      <TableHead className="text-right">Stock Nuevo</TableHead>
                      <TableHead>Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/products/${m.productId}`}
                            className="text-sm font-medium hover:underline text-primary"
                          >
                            {m.productName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge type={movementBadgeType(m.type)} label={movementLabel(m.type)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{m.previousStock}</TableCell>
                        <TableCell className="text-right font-medium">{m.newStock}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {m.note}
                          {m.referenceId && m.type === 'venta' && (
                            <Link href={`/sales/${m.referenceId}`} className="ml-1 text-primary hover:underline">
                              Ver venta
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  pageSizeOptions={pageSizeOptions}
                  itemRange={itemRange}
                  hasNextPage={hasNextPage}
                  hasPrevPage={hasPrevPage}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="movimientos"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
