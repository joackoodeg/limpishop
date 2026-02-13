'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../components/PageHeader';

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
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateProductsPDF() {
    const doc = new jsPDF();

    try {
      const img = new Image();
      img.src = '/logo.jpg';
      await new Promise((resolve) => {
        img.onload = () => {
          doc.addImage(img, 'JPEG', 20, 10, 30, 30);
          resolve(true);
        };
        img.onerror = () => resolve(true);
      });
    } catch {
      console.log('No se pudo cargar el logo');
    }

    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Lista de Productos - El Limipito', 60, 25);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('WhatsApp: 342-486-9674', 60, 35);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Consultar por precio de distintas cantidades (1/2, 1, 10 Litros)', 60, 42);

    const tableData: string[][] = [];

    products.forEach((product) => {
      if (product.prices && product.prices.length > 0) {
        const highestQuantityPrice = product.prices.reduce((highest, current) => {
          const currentQuantity = parseFloat(String(current.quantity)) || 0;
          const highestQuantity = parseFloat(String(highest.quantity)) || 0;
          return currentQuantity > highestQuantity ? current : highest;
        }, product.prices[0]);

        const priceValue = parseFloat(String(highestQuantityPrice.price)) || 0;
        const capitalizedName = product.name.charAt(0).toUpperCase() + product.name.slice(1);
        tableData.push([capitalizedName, `$${Math.round(priceValue)}`]);
      } else {
        const capitalizedName = product.name.charAt(0).toUpperCase() + product.name.slice(1);
        tableData.push([capitalizedName, 'Sin precio']);
      }
    });

    autoTable(doc, {
      head: [['Producto', 'Precio']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontSize: 11, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60 } },
      didDrawPage: function (data) {
        if (data.pageNumber > 1) {
          doc.setPage(data.pageNumber);
          data.settings.margin.top = 20;
          data.settings.startY = 20;
        }
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${data.pageNumber} | WhatsApp: 342-486-9674`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
      willDrawPage: function (data) {
        if (data.pageNumber > 1) {
          data.settings.startY = 20;
        }
      }
    });

    doc.save(`ElLimpito-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return (
    <div>
      <PageHeader title="Reportes" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-6">
            Genera un PDF con todos los productos, sus variantes y precios
          </p>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Total de productos: {products.length}</p>
                <p>WhatsApp: 342-486-9674</p>
              </div>
              <Button
                onClick={generateProductsPDF}
                disabled={products.length === 0}
                size="lg"
              >
                Generar PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
