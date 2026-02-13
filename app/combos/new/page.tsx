'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewComboPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [comboProducts, setComboProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountPercentage: 0,
        finalPrice: 0,
    });
    const [originalPrice, setOriginalPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    // Recalcular precio original cuando cambien los productos del combo
    useEffect(() => {
        const total = comboProducts.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        setOriginalPrice(total);

        // Recalcular precio final si hay descuento
        if (formData.discountPercentage > 0) {
            const discountedPrice = total * (1 - formData.discountPercentage / 100);
            setFormData(prev => ({ ...prev, finalPrice: Number(discountedPrice.toFixed(2)) }));
        } else {
            setFormData(prev => ({ ...prev, finalPrice: Number(total.toFixed(2)) }));
        }
    }, [comboProducts, formData.discountPercentage]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const addProductToCombo = (product) => {
        // Verificar si el producto ya está en el combo
        const existingProduct = comboProducts.find(p => p.productId === product.id);
        if (existingProduct) {
            alert('Este producto ya está en el combo');
            return;
        }

        // Obtener el precio más bajo del producto (primer precio en el array)
        const price = product.prices && product.prices.length > 0 ? product.prices[0].price : 0;

        const newComboProduct = {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: price
        };

        setComboProducts([...comboProducts, newComboProduct]);
    };

    const updateComboProductQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeProductFromCombo(productId);
            return;
        }

        setComboProducts(comboProducts.map(p =>
            p.productId === productId
                ? { ...p, quantity: Number(quantity) }
                : p
        ));
    };

    const removeProductFromCombo = (productId) => {
        setComboProducts(comboProducts.filter(p => p.productId !== productId));
    };

    const handleDiscountChange = (discountPercentage) => {
        const discount = Number(discountPercentage);
        setFormData(prev => ({ ...prev, discountPercentage: discount }));

        if (discount >= 0 && discount <= 100) {
            const discountedPrice = originalPrice * (1 - discount / 100);
            setFormData(prev => ({ ...prev, finalPrice: Number(discountedPrice.toFixed(2)) }));
        }
    };

    const handleFinalPriceChange = (price) => {
        setFormData(prev => ({ ...prev, finalPrice: Number(price) }));
    };

    // Filtrar productos basado en el término de búsqueda
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Por favor ingresa un nombre para el combo');
            return;
        }

        if (comboProducts.length === 0) {
            alert('Por favor agrega al menos un producto al combo');
            return;
        }

        if (formData.finalPrice <= 0) {
            alert('El precio final debe ser mayor a 0');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/combos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    products: comboProducts.map(p => ({
                        productId: p.productId,
                        productName: p.productName,
                        quantity: p.quantity,
                        price: p.price
                    })),
                    originalPrice: originalPrice,
                    discountPercentage: formData.discountPercentage,
                    finalPrice: formData.finalPrice,
                }),
            });

            if (response.ok) {
                router.push('/combos');
            } else {
                alert('Error al crear el combo');
            }
        } catch (error) {
            console.error('Error creating combo:', error);
            alert('Error al crear el combo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Crear Nuevo Combo</h1>
                    <Link
                        href="/combos"
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                        Volver a Combos
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información básica */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4">Información del Combo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del Combo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Combo Limpieza Básica"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Descripción del combo"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selección de productos */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4">Agregar Productos</h2>

                        {/* Buscador de productos */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar productos
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Escribe el nombre del producto para buscarlo..."
                            />
                            {searchTerm && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Mostrando {filteredProducts.length} de {products.length} productos
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {filteredProducts.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                    {searchTerm ?
                                        `No se encontraron productos que coincidan con "${searchTerm}"` :
                                        'No hay productos disponibles'
                                    }
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <div key={product.id} className="border rounded-lg p-3">
                                        <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mb-2">Stock: {product.stock}</p>
                                        {product.prices && product.prices.length > 0 && (
                                            <p className="text-sm mb-2">${product.prices[0].price}</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => addProductToCombo(product)}
                                            className="w-full bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                                            disabled={comboProducts.some(p => p.productId === product.id)}
                                        >
                                            {comboProducts.some(p => p.productId === product.id) ? 'Ya agregado' : 'Agregar'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Productos en el combo */}
                        {comboProducts.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium mb-3">Productos en el Combo</h3>
                                <div className="space-y-3">
                                    {comboProducts.map((item) => (
                                        <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.productName}</h4>
                                                <p className="text-sm text-gray-500">${item.price} c/u</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm">Cantidad:</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateComboProductQuantity(item.productId, e.target.value)}
                                                        className="w-16 p-1 border border-gray-300 rounded text-center"
                                                    />
                                                </div>
                                                <div className="text-sm font-medium">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProductFromCombo(item.productId)}
                                                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Precios y descuento */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4">Precios y Descuento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Precio Original
                                </label>
                                <input
                                    type="text"
                                    value={`$${originalPrice.toFixed(2)}`}
                                    readOnly
                                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descuento (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.discountPercentage}
                                    onChange={(e) => handleDiscountChange(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Precio Final *
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.finalPrice}
                                    onChange={(e) => handleFinalPriceChange(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        {formData.discountPercentage > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-700">
                                    Descuento aplicado: ${(originalPrice * formData.discountPercentage / 100).toFixed(2)}
                                    ({formData.discountPercentage}% de ${originalPrice.toFixed(2)})
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || comboProducts.length === 0}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creando...' : 'Crear Combo'}
                        </button>
                        <Link
                            href="/combos"
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
} 