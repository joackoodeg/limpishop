import { db } from '@/lib/db';
import { products, sales, saleItems } from '@/lib/db/schema';
import { gte, sql, eq } from 'drizzle-orm';
import { getTodayDateString } from '@/lib/utils/date';

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
}

/**
 * Fetch dashboard statistics server-side
 * Uses parallel queries for optimal performance
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = getTodayDateString();
  const todayStart = `${today}T00:00:00`;

  try {
    // Execute all queries in parallel
    const [allProducts, todaySalesData] = await Promise.all([
      // Get all products with their stock
      db.select({
        id: products.id,
        stock: products.stock,
      }).from(products),
      
      // Get today's sales summary
      db.select({
        totalRevenue: sql<number>`COALESCE(SUM(${sales.grandTotal}), 0)`,
        totalSales: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(gte(sales.date, todayStart)),
    ]);

    // Calculate stats from products
    const totalProducts = allProducts.length;
    const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= 5).length;

    // Get today's sales data
    const salesSummary = todaySalesData[0] || { totalRevenue: 0, totalSales: 0 };

    // Calculate total units sold today
    const todayUnits = await db.select({
      totalUnits: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.size}), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(gte(sales.date, todayStart));

    return {
      totalProducts,
      lowStockProducts,
      todaySales: Number(todayUnits[0]?.totalUnits || 0),
      todayRevenue: Number(salesSummary.totalRevenue || 0),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return safe defaults on error
    return {
      totalProducts: 0,
      lowStockProducts: 0,
      todaySales: 0,
      todayRevenue: 0,
    };
  }
}
