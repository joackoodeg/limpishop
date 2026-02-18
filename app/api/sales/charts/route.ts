import { NextRequest, NextResponse } from 'next/server';
import { getSales } from '@/lib/data/sales';

export interface DailyStat {
  date: string;
  ventas: number;
  ingresos: number;
}

export interface TopProduct {
  productName: string;
  quantity: number;
  revenue: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  total: number;
}

export interface ChartsData {
  dailySales: DailyStat[];
  topProducts: TopProduct[];
  paymentMethods: PaymentMethodStat[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const paymentMethod = searchParams.get('paymentMethod') ?? 'all';

    let allSales = await getSales({ from, to });

    // Filter by payment method if specified
    if (paymentMethod !== 'all') {
      allSales = allSales.filter((s) => s.paymentMethod === paymentMethod);
    }

    // --- Daily aggregation ---
    const dailyMap = new Map<string, { ventas: number; ingresos: number }>();
    for (const sale of allSales) {
      const day = sale.date.split('T')[0];
      const existing = dailyMap.get(day) ?? { ventas: 0, ingresos: 0 };
      const units = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      dailyMap.set(day, {
        ventas: existing.ventas + units,
        ingresos: existing.ingresos + sale.grandTotal,
      });
    }
    const dailySales: DailyStat[] = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        ventas: Math.round(stats.ventas * 100) / 100,
        ingresos: Math.round(stats.ingresos * 100) / 100,
      }));

    // --- Top products aggregation ---
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    for (const sale of allSales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productName) ?? { quantity: 0, revenue: 0 };
        productMap.set(item.productName, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
        });
      }
    }
    const topProducts: TopProduct[] = Array.from(productMap.entries())
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(([productName, stats]) => ({
        productName,
        quantity: Math.round(stats.quantity * 100) / 100,
        revenue: Math.round(stats.revenue * 100) / 100,
      }));

    // --- Payment method aggregation ---
    const methodMap = new Map<string, { count: number; total: number }>();
    for (const sale of allSales) {
      const method = sale.paymentMethod ?? 'desconocido';
      const existing = methodMap.get(method) ?? { count: 0, total: 0 };
      methodMap.set(method, {
        count: existing.count + 1,
        total: existing.total + sale.grandTotal,
      });
    }
    const paymentMethods: PaymentMethodStat[] = Array.from(methodMap.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([method, stats]) => ({
        method,
        count: stats.count,
        total: Math.round(stats.total * 100) / 100,
      }));

    const data: ChartsData = { dailySales, topProducts, paymentMethods };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching charts data:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos de gráficos' },
      { status: 500 }
    );
  }
}
