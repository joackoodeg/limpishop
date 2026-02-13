'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  size: number;
}

interface Sale {
  id: number;
  items: SaleItem[];
  grandTotal: number;
  paymentMethod: string;
  date: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    const res = await fetch('/api/sales');
    const data = await res.json();
    setSales(data);
  }

  async function handleDelete(saleId: number) {
    const ok = confirm('¿Seguro que deseas eliminar esta venta? Esta acción restaurará el stock del producto.');
    if (ok) {
      await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE',
      });
      fetchSales();
    }
  }

  function getSaleTotal(sale: Sale): number {
    return sale.grandTotal;
  }

  function getSaleDate(sale: Sale): string {
    return new Date(sale.date).toLocaleString();
  }

  function matchesFilter(sale: Sale): boolean {
    const saleDate = new Date(sale.date);
    const afterFrom = from ? saleDate >= new Date(from) : true;
    const beforeTo = to ? saleDate <= new Date(to + 'T23:59:59') : true;

    const matchesProduct = sale.items.some(item =>
      item.productName.toLowerCase().includes(query.toLowerCase())
    );

    return matchesProduct && afterFrom && beforeTo;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Historial de Ventas</h1>
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <Link href="/sales/new">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Realizar Venta
          </button>
        </Link>
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
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
        </div>
      </div>

      <div className="space-y-4">
        {sales
          .filter(matchesFilter)
          .map((sale) => (
            <div key={sale.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    Venta #{sale.id}
                  </h3>
                  <p className="text-sm text-gray-600">{getSaleDate(sale)}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    Pago: {sale.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ${getSaleTotal(sale).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm mt-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="space-y-2">
                  {sale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({item.size} unidades)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">
                          {item.quantity} × ${item.price} =
                        </span>
                        <span className="font-medium ml-1">
                          ${(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>

      {sales.filter(matchesFilter).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron ventas
        </div>
      )}
    </div>
  );
}

