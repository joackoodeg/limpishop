'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CombosPage() {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCombos();
    }, []);

    const fetchCombos = async () => {
        try {
            const response = await fetch('/api/combos');
            const data = await response.json();
            setCombos(data);
        } catch (error) {
            console.error('Error fetching combos:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleComboStatus = async (id, currentStatus) => {
        try {
            const combo = combos.find(c => c._id === id);
            const response = await fetch(`/api/combos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...combo,
                    active: !currentStatus
                }),
            });

            if (response.ok) {
                fetchCombos();
            }
        } catch (error) {
            console.error('Error updating combo:', error);
        }
    };

    const deleteCombo = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este combo?')) {
            try {
                const response = await fetch(`/api/combos/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    fetchCombos();
                }
            } catch (error) {
                console.error('Error deleting combo:', error);
            }
        }
    };

    const generateCombosPDF = async () => {
        const doc = new jsPDF();
        let currentY = 55;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;

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
        doc.text('Lista de Combos - El Limipito', 60, 25);

        // WhatsApp
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('WhatsApp: 342-486-9674', 60, 35);

        // Descripción
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Combos disponibles con ofertas especiales', 60, 42);

        // Filtrar combos activos
        const activeCombos = combos.filter(combo => combo.active);

        if (activeCombos.length === 0) {
            doc.setFontSize(14);
            doc.setTextColor(100);
            doc.text('No hay combos activos disponibles', margin, currentY);
        } else {
            // Mostrar cada combo por separado
            activeCombos.forEach((combo, index) => {
                // Verificar si necesitamos una nueva página
                if (currentY > pageHeight - 100) {
                    doc.addPage();
                    currentY = 30;
                }

                // Nombre del combo
                doc.setFontSize(16);
                doc.setTextColor(40);
                const capitalizedName = combo.name.charAt(0).toUpperCase() + combo.name.slice(1);
                doc.text(capitalizedName, margin, currentY);
                currentY += 10;

                // Descripción del combo
                if (combo.description) {
                    doc.setFontSize(11);
                    doc.setTextColor(80);
                    doc.text(combo.description, margin, currentY);
                    currentY += 8;
                }

                // Información de precios
                const originalPrice = combo.originalPrice?.toFixed(2) || '0.00';
                const finalPrice = combo.finalPrice?.toFixed(2) || '0.00';
                const discount = combo.discountPercentage || 0;
                const savings = (combo.originalPrice - combo.finalPrice).toFixed(2);

                // Crear datos de la tabla única
                const tableData = [];

                // Agregar productos
                if (combo.products && combo.products.length > 0) {
                    combo.products.forEach(p => {
                        tableData.push([
                            p.productName,
                            p.quantity.toString(),
                            `$${p.price?.toFixed(2) || '0.00'}`,
                            `$${(p.price * p.quantity).toFixed(2)}`
                        ]);
                    });
                }

                // Agregar fila de subtotal
                tableData.push([
                    '',
                    '',
                    'SUBTOTAL:',
                    `$${originalPrice}`
                ]);

                // Agregar fila de descuento y precio final
                if (discount > 0) {
                    tableData.push([
                        `DESCUENTO ${discount}%:`,
                        '',
                        `Antes: $${originalPrice}`,
                        `$${finalPrice}`
                    ]);
                } else {
                    tableData.push([
                        'PRECIO FINAL:',
                        '',
                        '',
                        `$${finalPrice}`
                    ]);
                }

                const tableResult = autoTable(doc, {
                    head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
                    body: tableData,
                    startY: currentY,
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: [80, 80, 80],
                        fontSize: 10,
                        fontStyle: 'bold',
                    },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 25, halign: 'center' },
                        2: { cellWidth: 30, halign: 'right' },
                        3: { cellWidth: 30, halign: 'right' },
                    },
                    didParseCell: function (data) {
                        // Estilo para la fila de subtotal
                        if (data.row.index === tableData.length - 2) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [248, 249, 250];
                        }
                        // Estilo para la fila de descuento/precio final
                        if (data.row.index === tableData.length - 1) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [220, 255, 220];

                            // Color diferente para el precio anterior si hay descuento
                            if (discount > 0 && data.column.index === 2) {
                                data.cell.styles.textColor = [150, 150, 150];
                                data.cell.styles.fontSize = 8;
                            } else {
                                data.cell.styles.textColor = [0, 100, 0];
                            }

                            // Precio final en verde
                            if (data.column.index === 3) {
                                data.cell.styles.textColor = [0, 100, 0];
                                data.cell.styles.fontSize = 11;
                            }
                        }
                    },
                    margin: { left: margin }
                });

                currentY = (doc as any).lastAutoTable.finalY + 15;

                // Línea separadora entre combos (excepto el último)
                if (index < activeCombos.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, currentY, 190, currentY);
                    currentY += 10;
                }
            });
        }

        // Pie de página en todas las páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Página ${i} de ${pageCount} | WhatsApp: 342-486-9674`,
                margin,
                pageHeight - 10
            );
        }

        // Guardar el PDF
        doc.save(`ElLimpito-Combos-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Cargando combos...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Combos</h1>
                <div className="flex gap-2">
                    <button
                        onClick={generateCombosPDF}
                        disabled={loading || combos.length === 0}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Cargando...' : 'Crear PDF'}
                    </button>
                    <Link
                        href="/combos/new"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Crear Nuevo Combo
                    </Link>
                </div>
            </div>

            {combos.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No hay combos creados aún.</p>
                    <Link
                        href="/combos/new"
                        className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Crear el primer combo
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {combos.map((combo) => (
                        <div key={combo._id} className="border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-xl font-semibold">{combo.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${combo.active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {combo.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-2">{combo.description}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <strong>Precio Original:</strong> ${combo.originalPrice?.toFixed(2)}
                                        </div>
                                        <div>
                                            <strong>Descuento:</strong> {combo.discountPercentage}%
                                        </div>
                                        <div>
                                            <strong>Precio Final:</strong> ${combo.finalPrice?.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">
                                        <strong>Productos:</strong> {combo.products?.map(p => `${p.productName} (${p.quantity})`).join(', ')}
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Link
                                        href={`/combos/${combo._id}`}
                                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                    >
                                        Ver
                                    </Link>
                                    <Link
                                        href={`/combos/${combo._id}/edit`}
                                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                                    >
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => toggleComboStatus(combo._id, combo.active)}
                                        className={`px-3 py-1 rounded text-sm ${combo.active
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                            }`}
                                    >
                                        {combo.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => deleteCombo(combo._id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <Link
                    href="/"
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
} 