'use client';

import { useState, useEffect } from 'react';
import CategoryImage from '../components/CategoryImage';
import ImageUpload from '../components/ImageUpload';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [editingCategory, setEditingCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [showImageUpload, setShowImageUpload] = useState({});

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            setError('Error fetching categories');
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
            setLoading(false);
        } catch (error) {
            setError('Error fetching products');
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return;

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory)
            });

            if (response.ok) {
                setNewCategory({ name: '', description: '' });
                fetchCategories();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.error);
            }
        } catch (error) {
            setError('Error creating category');
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.name.trim()) return;

        try {
            const response = await fetch(`/api/categories/${editingCategory._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingCategory.name,
                    description: editingCategory.description
                })
            });

            if (response.ok) {
                setEditingCategory(null);
                fetchCategories();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.error);
            }
        } catch (error) {
            setError('Error updating category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;

        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchCategories();
                fetchProducts(); // Refresh products in case some were affected
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.error);
            }
        } catch (error) {
            setError('Error deleting category');
        }
    };

    const handleAssignProductToCategory = async (e) => {
        e.preventDefault();
        if (!selectedProductId || !selectedCategoryId) return;

        try {
            const product = products.find(p => p._id === selectedProductId);
            const category = categories.find(c => c._id === selectedCategoryId);

            const response = await fetch(`/api/products/${selectedProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...product,
                    categoryId: selectedCategoryId
                })
            });

            if (response.ok) {
                fetchProducts();
                setSelectedProductId('');
                setSelectedCategoryId('');
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.error);
            }
        } catch (error) {
            setError('Error assigning product to category');
        }
    };

    const handleRemoveProductFromCategory = async (productId) => {
        if (!confirm('¿Quieres quitar este producto de su categoría?')) return;

        try {
            const product = products.find(p => p._id === productId);
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...product,
                    categoryId: null
                })
            });

            if (response.ok) {
                fetchProducts();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.error);
            }
        } catch (error) {
            setError('Error removing product from category');
        }
    };

    const handleImageUploaded = (data) => {
        // Actualizar la categoría en el estado local
        setCategories(prev => prev.map(cat => 
            cat._id === data.category._id ? data.category : cat
        ));
        setError('');
    };

    const toggleImageUpload = (categoryId) => {
        setShowImageUpload(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    if (loading) return <div className="p-6">Cargando...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gestión de Categorías</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Crear nueva categoría */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                        <input
                            type="text"
                            value={editingCategory ? editingCategory.name : newCategory.name}
                            onChange={(e) => editingCategory 
                                ? setEditingCategory({...editingCategory, name: e.target.value})
                                : setNewCategory({...newCategory, name: e.target.value})
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                        <textarea
                            value={editingCategory ? editingCategory.description : newCategory.description}
                            onChange={(e) => editingCategory 
                                ? setEditingCategory({...editingCategory, description: e.target.value})
                                : setNewCategory({...newCategory, description: e.target.value})
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={3}
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            {editingCategory ? 'Actualizar' : 'Crear'}
                        </button>
                        {editingCategory && (
                            <button
                                type="button"
                                onClick={() => setEditingCategory(null)}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Lista de categorías */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Categorías Existentes</h2>
                {categories.length === 0 ? (
                    <p className="text-gray-500">No hay categorías creadas</p>
                ) : (
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <div key={category._id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-lg">{category.name}</h3>
                                        {category.description && (
                                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => toggleImageUpload(category._id)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                                        >
                                            {category.image?.url ? 'Cambiar imagen' : 'Agregar imagen'}
                                        </button>
                                        <button
                                            onClick={() => setEditingCategory(category)}
                                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category._id)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Mostrar imagen actual */}
                                <div className="flex items-start space-x-4">
                                    <CategoryImage 
                                        category={category}
                                        width={120}
                                        height={120}
                                        className="flex-shrink-0"
                                    />
                                    
                                    {/* Upload de imagen */}
                                    {showImageUpload[category._id] && (
                                        <div className="flex-1">
                                            <ImageUpload
                                                entityType="category"
                                                entityId={category._id}
                                                currentImage={category.image?.url}
                                                onImageUploaded={handleImageUploaded}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Asignar productos a categorías */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Asignar Producto a Categoría</h2>
                <form onSubmit={handleAssignProductToCategory} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Producto</label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            >
                                <option value="">Seleccionar producto</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                        {product.name} {product.categoryName && `(${product.categoryName})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoría</label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            >
                                <option value="">Seleccionar categoría</option>
                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Asignar
                    </button>
                </form>
            </div>

            {/* Lista de productos por categoría */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Productos por Categoría</h2>
                
                {categories.map((category) => {
                    const categoryProducts = products.filter(p => p.categoryId === category._id);
                    return (
                        <div key={category._id} className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                {category.name} ({categoryProducts.length} productos)
                            </h3>
                            {categoryProducts.length === 0 ? (
                                <p className="text-gray-500 text-sm ml-4">No hay productos en esta categoría</p>
                            ) : (
                                <div className="ml-4 space-y-1">
                                    {categoryProducts.map((product) => (
                                        <div key={product._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span>{product.name}</span>
                                            <button
                                                onClick={() => handleRemoveProductFromCategory(product._id)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Productos sin categoría */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Sin Categoría ({products.filter(p => !p.categoryId).length} productos)
                    </h3>
                    {products.filter(p => !p.categoryId).length === 0 ? (
                        <p className="text-gray-500 text-sm ml-4">Todos los productos tienen categoría asignada</p>
                    ) : (
                        <div className="ml-4 space-y-1">
                            {products.filter(p => !p.categoryId).map((product) => (
                                <div key={product._id} className="p-2 bg-gray-50 rounded">
                                    <span>{product.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}