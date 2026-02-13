"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProductStat {
    _id: string;
    productName: string;
    quantity: number;
    revenue: number;
    costTotal?: number;
    netRevenue?: number;
}

export default function SalesSummaryPage() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ overall: { units: number; revenue: number; net: number }; products: ProductStat[] } | null>(null);

    async function fetchSummary() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const res = await fetch(`/api/sales/summary?${params.toString()}`);
            const data = await res.json();
            setStats({ overall: data.overall, products: data.products });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Resumen de Ventas</h1>
            <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                        onClick={fetchSummary}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        disabled={loading}
                    >
                        {loading ? 'Cargando…' : 'Aplicar'}
                    </button>
                </div>
            </div>

            {stats && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white shadow rounded-lg p-6 text-center">
                            <div className="text-sm text-gray-500">Ingresos totales</div>
                            <div className="text-2xl font-bold">${stats.overall.revenue.toFixed(2)}</div>
                        </div>
                        <div className="bg-white shadow rounded-lg p-6 text-center">
                            <div className="text-sm text-gray-500">Unidades vendidas</div>
                            <div className="text-2xl font-bold">{stats.overall.units}</div>
                        </div>
                        <div className="bg-white shadow rounded-lg p-6 text-center">
                            <div className="text-sm text-gray-500">Ingreso neto</div>
                            <div className="text-2xl font-bold">${stats.overall.net.toFixed(2)}</div>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold mb-3">Productos más vendidos</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white divide-y divide-gray-200 shadow rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ingresos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stats.products.map((p) => (
                                    <tr key={p._id}>
                                        <td className="px-4 py-2 whitespace-nowrap">{p.productName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{p.quantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">${p.revenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
} 