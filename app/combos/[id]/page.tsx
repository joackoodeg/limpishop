'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ComboDetailPage() {
    const params = useParams();
    const [combo, setCombo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchCombo();
        }
    }, [params.id]);

    const fetchCombo = async () => {
        try {
            const response = await fetch(`/api/combos/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setCombo(data);
            } else {
                console.error('Combo not found');
            }
        } catch (error) {
            console.error('Error fetching combo:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleComboStatus = async () => {
        try {
            const response = await fetch(`/api/combos/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...combo,
                    active: !combo.active
                }),
            });

            if (response.ok) {
                setCombo(prev => ({ ...prev, active: !prev.active }));
            }
        } catch (error) {
            console.error('Error updating combo:', error);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Cargando combo...</div>
            </div>
        );
    }

    if (!combo) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Combo no encontrado</h1>
                    <Link
                        href="/combos"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Volver a Combos
                    </Link>
                </div>
            </div>
        );
    }

    const savings = combo.originalPrice - combo.finalPrice;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Detalles del Combo</h1>
                    <div className="flex gap-2">
                        <Link
                            href={`/combos/${combo.id}/edit`}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                        >
                            Editar
                        </Link>
                        <Link
                            href="/combos"
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                        >
                            Volver a Combos
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Información básica */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-semibold">{combo.name}</h2>
                                {combo.description && (
                                    <p className="text-gray-600 mt-2">{combo.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${combo.active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {combo.active ? 'Activo' : 'Inactivo'}
                                </span>
                                <button
                                    onClick={toggleComboStatus}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${combo.active
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                >
                                    {combo.active ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    ${combo.originalPrice?.toFixed(2)}
                                </div>
                                <div className="text-sm text-blue-800">Precio Original</div>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">
                                    {combo.discountPercentage}%
                                </div>
                                <div className="text-sm text-orange-800">Descuento</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    ${combo.finalPrice?.toFixed(2)}
                                </div>
                                <div className="text-sm text-green-800">Precio Final</div>
                            </div>
                        </div>

                        {savings > 0 && (
                            <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                                <p className="text-green-800 font-medium">
                                    ¡Ahorro de ${savings.toFixed(2)} con este combo!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Productos en el combo */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-xl font-semibold mb-4">Productos incluidos</h3>
                        <div className="space-y-3">
                            {combo.products?.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-lg">{product.productName}</h4>
                                        <p className="text-sm text-gray-600">
                                            Precio unitario: ${product.price?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-center mx-4">
                                        <div className="text-lg font-semibold">
                                            {product.quantity}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {product.quantity === 1 ? 'unidad' : 'unidades'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-semibold">
                                            ${(product.price * product.quantity).toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500">Subtotal</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-xl font-semibold mb-4">Información adicional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>Creado:</strong> {new Date(combo.createdAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            {combo.updatedAt && combo.updatedAt !== combo.createdAt && (
                                <div>
                                    <strong>Última actualización:</strong> {new Date(combo.updatedAt).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            )}
                            <div>
                                <strong>Total de productos:</strong> {combo.products?.length || 0}
                            </div>
                            <div>
                                <strong>Cantidad total de items:</strong> {combo.products?.reduce((sum, p) => sum + p.quantity, 0) || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 