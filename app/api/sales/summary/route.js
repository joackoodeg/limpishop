import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, saleItems, products } from '@/lib/db/schema';
import { sql, gte, lte, eq, and } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const from = fromStr || '1970-01-01T00:00:00';
    const to = toStr ? toStr + 'T23:59:59' : new Date().toISOString();

    // Get all sale items within the date range, joined with their sales for date filtering
    // and with products for cost data
    const rows = await db
      .select({
        productId: saleItems.productId,
        productName: saleItems.productName,
        quantity: saleItems.quantity,
        price: saleItems.price,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(gte(sales.date, from), lte(sales.date, to)));

    // Aggregate in JS (since SQLite aggregation with Drizzle is simpler this way)
    const productMap = {};
    for (const row of rows) {
      const key = row.productId || row.productName;
      if (!productMap[key]) {
        productMap[key] = {
          _id: row.productId,
          productName: row.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productMap[key].quantity += row.quantity;
      productMap[key].revenue += row.price * row.quantity;
    }

    // Get cost for each product
    const productIds = Object.values(productMap)
      .map(p => p._id)
      .filter(Boolean);

    const productCosts = {};
    if (productIds.length > 0) {
      const prods = await db.select({ id: products.id, cost: products.cost }).from(products);
      for (const p of prods) {
        productCosts[p.id] = p.cost || 0;
      }
    }

    // Build product stats
    const productStats = Object.values(productMap).map(p => {
      const costUnit = p._id ? (productCosts[p._id] || 0) : 0;
      const costTotal = costUnit * p.quantity;
      const netRevenue = p.revenue - costTotal;
      return {
        ...p,
        costUnit,
        costTotal,
        netRevenue,
      };
    });

    // Sort by quantity desc
    productStats.sort((a, b) => b.quantity - a.quantity);

    // Overall totals
    const overall = productStats.reduce(
      (acc, p) => {
        acc.units += p.quantity;
        acc.revenue += p.revenue;
        acc.cost += p.costTotal;
        return acc;
      },
      { units: 0, revenue: 0, cost: 0 }
    );
    overall.net = overall.revenue - overall.cost;

    return NextResponse.json({ from, to, overall, products: productStats });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error generating summary' }, { status: 500 });
  }
}
