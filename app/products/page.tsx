'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductImage from '../components/ProductImage';

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
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    active: 'all', // 'all', 'active', 'inactive'
    stock: 'all', // 'all', 'inStock', 'lowStock', 'outOfStock'
    category: 'all', // 'all' or categoryId
    featured: 'all' // 'all', 'featured', 'notFeatured'
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  }

  useEffect(()=>{
    console.log('Products updated:', products);
  }, [products])

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
    const ok = confirm('¿Seguro que deseas eliminar este producto?');
    if (ok) {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      fetchProducts();
    }
  }

  async function handleToggleActive(productId: number) {
    try {
      const res = await fetch(`/api/products/${productId}/toggle-active`, {
        method: 'PATCH',
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  }

  async function handleToggleFeatured(productId: number) {
    try {
      const res = await fetch(`/api/products/${productId}/toggle-featured`, {
        method: 'PATCH',
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling product featured status:', error);
    }
  }

  const filteredProducts = products.filter(product => {
    // Filtro de búsqueda por nombre
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    
    // Filtro de estado activo/inactivo
    const matchesActive = filters.active === 'all' || 
      (filters.active === 'active' && product.active) ||
      (filters.active === 'inactive' && !product.active);
    
    // Filtro de stock
    let matchesStock = true;
    if (filters.stock === 'inStock') {
      matchesStock = product.stock > 5; // Más de 5 unidades
    } else if (filters.stock === 'lowStock') {
      matchesStock = product.stock > 0 && product.stock <= 5; // Entre 1 y 5 unidades
    } else if (filters.stock === 'outOfStock') {
      matchesStock = product.stock === 0; // Sin stock
    }
    
    // Filtro de categoría
    const matchesCategory = filters.category === 'all' || 
      String(product.categoryId) === filters.category ||
      (filters.category === 'uncategorized' && !product.categoryId);
    
    // Filtro de destacado
    const matchesFeatured = filters.featured === 'all' ||
      (filters.featured === 'featured' && product.featured) ||
      (filters.featured === 'notFeatured' && !product.featured);
    
    return matchesQuery && matchesActive && matchesStock && matchesCategory && matchesFeatured;
  });

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      active: 'all',
      stock: 'all',
      category: 'all',
      featured: 'all'
    });
    setQuery('');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Productos</h1>
      
      {/* Botones de acción principales */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <Link href="/products/new">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Agregar Producto
          </button>
        </Link>
        <Link href="/sales/new">
          <button className="bg-green-500 text-white px-4 py-2 rounded">
            Realizar Venta
          </button>
        </Link>
        <button
          onClick={clearFilters}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar productos por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Filtro de Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Filtro de Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <select
              value={filters.stock}
              onChange={(e) => handleFilterChange('stock', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todos</option>
              <option value="inStock">En Stock (&gt;5)</option>
              <option value="lowStock">Poco Stock (1-5)</option>
              <option value="outOfStock">Sin Stock (0)</option>
            </select>
          </div>

          {/* Filtro de Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todas</option>
              <option value="uncategorized">Sin Categoría</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Destacado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destacado</label>
            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todos</option>
              <option value="featured">Destacados</option>
              <option value="notFeatured">No destacados</option>
            </select>
          </div>
        </div>
        
        {/* Contador de resultados */}
        <div className="mt-3 text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`border rounded-lg p-4 shadow-sm relative ${product.active ? 'bg-white' : 'bg-gray-100'}`}>
            {/* Badges en la esquina superior derecha */}
            <div className="absolute top-2 right-2 flex gap-1 flex-col items-end">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.active ? 'Activo' : 'Inactivo'}
              </span>
              {product.featured && (
                <span className="bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                  ⭐ Destacado
                </span>
              )}
            </div>
            <div className="flex justify-between items-start mb-2 mr-24">
              <h2 className="text-xl font-semibold">{product.name}</h2>
            </div>
            {product.categoryName && (
              <p className="text-sm text-blue-600 mb-2">📁 {product.categoryName}</p>
            )}
            <p className="text-gray-600 mb-3">{product.description}</p>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Precios:</p>
              <ul className="text-sm text-gray-600">
                {product.prices && product.prices.map((p, i) => (
                  <li key={i}>{p.quantity} por ${p.price}</li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                product.stock === 0 
                  ? 'bg-red-100 text-red-800' 
                  : product.stock <= 5 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                Stock: {product.stock}
                {product.stock === 0 && ' (Agotado)'}
                {product.stock > 0 && product.stock <= 5 && ' (Poco stock)'}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/products/${product.id}`}>
                <button className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600">
                  Ver
                </button>
              </Link>
              <Link href={`/products/${product.id}/edit`}>
                <button className="bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600">
                  Editar
                </button>
              </Link>
              <button
                onClick={() => handleToggleActive(product.id)}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  product.active 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {product.active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => handleToggleFeatured(product.id)}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  product.featured 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {product.featured ? 'Quitar destacado' : 'Destacar'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">No se encontraron productos con los filtros aplicados</p>
          <button
            onClick={clearFilters}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay productos registrados
        </div>
      )}
    </div>
  );
}
