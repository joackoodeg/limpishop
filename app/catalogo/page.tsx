'use client';

import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '../components/PageHeader';
import {
  FileDown,
  Search,
  X,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────
interface Price {
  quantity: number | string;
  price: number | string;
}

interface Product {
  id: number;
  name: string;
  prices: Price[];
  stock: number | string;
  description: string;
  cost?: number | string;
  active?: boolean;
  featured?: boolean;
  categoryName?: string;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
}

interface StoreConfig {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoUrl?: string;
}

type SortField = 'name' | 'price' | 'category';
type SortDirection = 'asc' | 'desc';

// ── Component ───────────────────────────────────────────────────────────────
export default function CatalogPage() {
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'with' | 'without'>('all');

  // Sort
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // PDF options
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSubtitle, setPdfSubtitle] = useState('');
  const [showPhone, setShowPhone] = useState(true);
  const [showAllPrices, setShowAllPrices] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState<'highest' | 'lowest' | 'all'>('highest');

  // ── Fetch data ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories(), fetchStoreConfig()]).finally(() =>
      setLoading(false)
    );
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      // Select all by default
      setSelectedIds(new Set(data.map((p: Product) => p.id)));
    } catch (error) {
      console.error('Error fetching products:', error);
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

  async function fetchStoreConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setStoreConfig(data);
      setPdfTitle(`Lista de Productos - ${data.storeName || 'Mi Negocio'}`);
      if (data.phone) setPdfSubtitle(`WhatsApp: ${data.phone}`);
    } catch (error) {
      console.error('Error fetching store config:', error);
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter((p) => String(p.categoryId) === categoryFilter);
    }

    // Status
    if (statusFilter === 'active') result = result.filter((p) => p.active);
    else if (statusFilter === 'inactive') result = result.filter((p) => !p.active);
    else if (statusFilter === 'featured') result = result.filter((p) => p.featured);

    // Price
    if (priceFilter === 'with')
      result = result.filter((p) => p.prices && p.prices.length > 0);
    else if (priceFilter === 'without')
      result = result.filter((p) => !p.prices || p.prices.length === 0);

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'price') {
        const priceA = getDisplayPrice(a);
        const priceB = getDisplayPrice(b);
        cmp = priceA - priceB;
      } else if (sortField === 'category') {
        cmp = (a.categoryName || '').localeCompare(b.categoryName || '');
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, search, categoryFilter, statusFilter, priceFilter, sortField, sortDirection]);

  // Products that are both visible (filtered) and selected
  const selectedProducts = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)),
    [filteredProducts, selectedIds]
  );

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));
  const someVisibleSelected = filteredProducts.some((p) => selectedIds.has(p.id));

  // ── Helpers ─────────────────────────────────────────────────────────────
  function getDisplayPrice(product: Product): number {
    if (!product.prices || product.prices.length === 0) return 0;
    const prices = product.prices.map((p) => parseFloat(String(p.price)) || 0);
    if (priceDisplay === 'lowest') return Math.min(...prices);
    return Math.max(...prices);
  }

  function getHighestPrice(product: Product): number {
    if (!product.prices || product.prices.length === 0) return 0;
    return Math.max(...product.prices.map((p) => parseFloat(String(p.price)) || 0));
  }

  function formatPrice(value: number): string {
    return `$${Math.round(value).toLocaleString('es-AR')}`;
  }

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Selection handlers ──────────────────────────────────────────────────
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function selectNone() {
    setSelectedIds(new Set());
  }

  function selectAll() {
    setSelectedIds(new Set(products.map((p) => p.id)));
  }

  // ── Sort handler ────────────────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  // ── Reset filters ───────────────────────────────────────────────────────
  function resetFilters() {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setPriceFilter('all');
    setSortField('name');
    setSortDirection('asc');
  }

  const hasActiveFilters = search || categoryFilter !== 'all' || statusFilter !== 'all' || priceFilter !== 'all';

  // ── PDF Generation ──────────────────────────────────────────────────────
  async function generateProductsPDF() {
    const doc = new jsPDF();

    // Try to load logo
    try {
      const logoSrc = storeConfig?.logoUrl || '/logo.jpg';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoSrc;
      await new Promise((resolve) => {
        img.onload = () => {
          doc.addImage(img, 'JPEG', 20, 10, 30, 30);
          resolve(true);
        };
        img.onerror = () => resolve(true);
      });
    } catch {
      // no logo
    }

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(pdfTitle || 'Lista de Productos', 60, 25);

    // Subtitle / phone
    let yPos = 35;
    if (pdfSubtitle) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(pdfSubtitle, 60, yPos);
      yPos += 8;
    }
    if (showPhone && storeConfig?.phone && !pdfSubtitle.includes(storeConfig.phone)) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Tel: ${storeConfig.phone}`, 60, yPos);
      yPos += 8;
    }

    // Note
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} — ${selectedProducts.length} productos`, 60, yPos);
    yPos += 10;

    // Build table
    const headers: string[] = [];
    if (showCategory) headers.push('Categoría');
    headers.push('Producto');
    if (showDescription) headers.push('Descripción');
    if (showAllPrices || priceDisplay === 'all') {
      headers.push('Precios');
    } else {
      headers.push('Precio');
    }

    const tableData: string[][] = [];
    selectedProducts.forEach((product) => {
      const row: string[] = [];

      if (showCategory) row.push(product.categoryName || 'Sin categoría');

      row.push(capitalize(product.name));

      if (showDescription) row.push(product.description || '');

      if (product.prices && product.prices.length > 0) {
        if (showAllPrices || priceDisplay === 'all') {
          const allPrices = product.prices
            .sort((a, b) => (parseFloat(String(a.quantity)) || 0) - (parseFloat(String(b.quantity)) || 0))
            .map((p) => `${p.quantity}u → ${formatPrice(parseFloat(String(p.price)) || 0)}`)
            .join(' | ');
          row.push(allPrices);
        } else {
          row.push(formatPrice(getDisplayPrice(product)));
        }
      } else {
        row.push('Consultar');
      }

      tableData.push(row);
    });

    // Column widths
    const colStyles: Record<number, { cellWidth: number }> = {};
    let idx = 0;
    if (showCategory) { colStyles[idx] = { cellWidth: 35 }; idx++; }
    colStyles[idx] = { cellWidth: showDescription ? 45 : 70 }; idx++;
    if (showDescription) { colStyles[idx] = { cellWidth: 50 }; idx++; }
    colStyles[idx] = { cellWidth: showAllPrices || priceDisplay === 'all' ? 60 : 35 };

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [45, 45, 45],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
      columnStyles: colStyles,
      alternateRowStyles: { fillColor: [248, 248, 248] },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footer = showPhone && storeConfig?.phone
          ? `Página ${data.pageNumber} — ${storeConfig.phone}`
          : `Página ${data.pageNumber}`;
        doc.text(
          footer,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
      willDrawPage: function (data) {
        if (data.pageNumber > 1) {
          data.settings.startY = 20;
        }
      },
    });

    const fileName = (storeConfig?.storeName || 'Catalogo')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '');
    doc.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <PageHeader title="Generador de Catálogo" description="Creá tu lista de precios personalizada en PDF" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generador de Catálogo PDF"
        description="Personalizá y generá tu lista de precios para compartir con clientes"
      />

      {/* ── Top row: Filters + PDF Options ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Filters */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filtros de Productos</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1 text-xs">
                  <RotateCcw className="h-3 w-3" /> Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, descripción o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="featured">Destacados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Precio</Label>
                <Select value={priceFilter} onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="with">Con precio</SelectItem>
                    <SelectItem value="without">Sin precio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Opciones del PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Título</Label>
              <Input
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
                placeholder="Título del documento"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Subtítulo</Label>
              <Input
                value={pdfSubtitle}
                onChange={(e) => setPdfSubtitle(e.target.value)}
                placeholder="WhatsApp, dirección, etc."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mostrar precio</Label>
              <Select value={priceDisplay} onValueChange={(v) => setPriceDisplay(v as typeof priceDisplay)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">Mayor cantidad</SelectItem>
                  <SelectItem value="lowest">Menor cantidad</SelectItem>
                  <SelectItem value="all">Todos los precios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle options */}
            <div className="space-y-2 pt-1">
              <ToggleOption label="Mostrar teléfono en pie" checked={showPhone} onChange={setShowPhone} />
              <ToggleOption label="Mostrar descripción" checked={showDescription} onChange={setShowDescription} />
              <ToggleOption label="Mostrar categoría" checked={showCategory} onChange={setShowCategory} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Product selection table ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">Productos en el catálogo</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {selectedProducts.length} de {filteredProducts.length} seleccionados
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="h-8 text-xs">
                <CheckSquare className="h-3 w-3 mr-1" /> Todos
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone} className="h-8 text-xs">
                <Square className="h-3 w-3 mr-1" /> Ninguno
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={generateProductsPDF}
                disabled={selectedProducts.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Generar PDF ({selectedProducts.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No se encontraron productos</p>
              <p className="text-sm mt-1">Probá ajustar los filtros</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-3">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center"
                        title={allVisibleSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      >
                        {allVisibleSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : someVisibleSelected ? (
                          <div className="relative">
                            <Square className="h-4 w-4" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-2 w-2 bg-primary rounded-sm" />
                            </div>
                          </div>
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Producto <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Categoría <SortIcon field="category" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => handleSort('price')} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                        Precio <SortIcon field="price" />
                      </button>
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isSelected = selectedIds.has(product.id);
                    const price = getHighestPrice(product);
                    return (
                      <TableRow
                        key={product.id}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'opacity-60 hover:opacity-100'}`}
                        onClick={() => toggleSelect(product.id)}
                      >
                        <TableCell>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{capitalize(product.name)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {product.categoryName || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {price > 0 ? formatPrice(price) : (
                            <span className="text-muted-foreground text-xs">Sin precio</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(product.id);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title={isSelected ? 'Quitar del catálogo' : 'Agregar al catálogo'}
                          >
                            {isSelected ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sticky bottom bar ────────────────────────────────────────── */}
      {selectedProducts.length > 0 && (
        <div className="sticky bottom-4 z-10">
          <Card className="border-primary/20 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{selectedProducts.length} productos seleccionados</span>
                <span className="text-muted-foreground hidden sm:inline">
                  {categories.length > 0 && `${new Set(selectedProducts.map((p) => p.categoryId).filter(Boolean)).size} categorías`}
                </span>
              </div>
              <Button onClick={generateProductsPDF} className="gap-2">
                <FileDown className="h-4 w-4" />
                Descargar PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Toggle option helper ──────────────────────────────────────────────────
function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 w-full text-sm hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
    >
      <div
        className={`h-4 w-8 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <div
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </button>
  );
}
