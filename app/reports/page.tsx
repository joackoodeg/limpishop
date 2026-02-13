'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
}

export default function ReportsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            setLoading(true);
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
            console.log(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    async function generateProductsPDF() {
        const doc = new jsPDF();

        // Agregar logo solo en la primera página
        try {
            const img = new Image();
            img.src = '/logo.jpg';
            await new Promise((resolve) => {
                img.onload = () => {
                    // Agregar logo en la esquina superior izquierda
                    doc.addImage(img, 'JPEG', 20, 10, 30, 30);
                    resolve(true);
                };
                img.onerror = () => resolve(true); // Continúa aunque falle el logo
            });
        } catch (error) {
            console.log('No se pudo cargar el logo');
        }

        // Título del documento
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text('Lista de Productos - El Limipito', 60, 25);

        // WhatsApp
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('WhatsApp: 342-486-9674', 60, 35);

        // Descripción
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Consultar por precio de distintas cantidades (1/2, 1, 10 Litros)', 60, 42);

        // Preparar datos para la tabla
        const tableData = [];

        products.forEach((product) => {
            if (product.prices && product.prices.length > 0) {
                // Encontrar el precio más alto (variante con mayor cantidad)
                let highestQuantityPrice = product.prices.reduce((highest, current) => {
                    const currentQuantity = parseFloat(String(current.quantity)) || 0;
                    const highestQuantity = parseFloat(String(highest.quantity)) || 0;

                    return currentQuantity > highestQuantity ? current : highest;
                }, product.prices[0]);

                const priceValue = parseFloat(String(highestQuantityPrice.price)) || 0;

                // Capitalizar primera letra del nombre del producto
                const capitalizedName = product.name.charAt(0).toUpperCase() + product.name.slice(1);

                tableData.push([
                    capitalizedName,
                    `$${Math.round(priceValue)}`
                ]);
            } else {
                // Si no tiene precios definidos
                // Capitalizar primera letra del nombre del producto
                const capitalizedName = product.name.charAt(0).toUpperCase() + product.name.slice(1);

                tableData.push([
                    capitalizedName,
                    'Sin precio'
                ]);
            }
        });

        // Crear la tabla
        autoTable(doc, {
            head: [['Producto', 'Precio']],
            body: tableData,
            startY: 55, // Posición inicial para la primera página
            styles: {
                fontSize: 10,
                cellPadding: 5,
            },
            headStyles: {
                fillColor: [240, 240, 240], // Fondo gris claro
                textColor: [80, 80, 80],    // Texto gris oscuro
                fontSize: 11,
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 100 }, // Producto
                1: { cellWidth: 60 },  // Precio
            },
            didDrawPage: function (data) {
                // Ajusta la posición para páginas posteriores
                if (data.pageNumber > 1) {
                    // Las páginas posteriores no tienen logo ni encabezado
                    // Restablecemos la configuración para que empiece más arriba
                    // Esta línea se ejecuta al inicio de cada página nueva
                    doc.setPage(data.pageNumber);
                    data.settings.margin.top = 20;
                    data.settings.startY = 20;
                }

                // Pie de página con WhatsApp
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Página ${data.pageNumber} | WhatsApp: 342-486-9674`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            },
            // Importante: usar willDrawPage para páginas posteriores a la primera
            willDrawPage: function (data) {
                if (data.pageNumber > 1) {
                    // Configuramos el encabezado de páginas posteriores
                    // para que empiece más arriba
                    data.settings.startY = 20;
                }
            }
        });

        // Guardar el PDF
        doc.save(`ElLimpito-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Reportes</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Lista de Productos</h2>
                <p className="text-gray-600 mb-6">
                    Genera un PDF con todos los productos, sus variantes y precios
                </p>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">
                            Total de productos: {products.length}
                        </p>
                        <p className="text-sm text-gray-500">
                            WhatsApp: 342-486-9674
                        </p>
                    </div>

                    <button
                        onClick={generateProductsPDF}
                        disabled={loading || products.length === 0}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Cargando...' : 'Generar PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
} 