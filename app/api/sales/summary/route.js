import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromStr = searchParams.get('from');
        const toStr = searchParams.get('to');

        const from = fromStr ? new Date(fromStr) : new Date('1970-01-01');
        const to = toStr ? new Date(toStr + 'T23:59:59') : new Date();

        await connectDB();

        const pipeline = [
            { $match: { date: { $gte: from, $lte: to } } },
            {
                $project: {
                    items: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
                            // Venta moderna – ya tiene items
                            {
                                $map: {
                                    input: "$items",
                                    as: "it",
                                    in: {
                                        productId: "$$it.productId",
                                        productName: "$$it.productName",
                                        quantity: "$$it.quantity",
                                        revenue: { $multiply: ["$$it.price", "$$it.quantity"] },
                                    },
                                },
                            },
                            // Venta legacy – construir un único item
                            [
                                {
                                    productId: "$productId",
                                    productName: "$productName",
                                    quantity: "$quantity",
                                    revenue: "$total",
                                },
                            ],
                        ],
                    },
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.productName" },
                    quantity: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.revenue" },
                },
            },
            // Traer costo unitario desde la colección de productos
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "prod",
                },
            },
            {
                $addFields: {
                    costUnit: { $ifNull: [{ $arrayElemAt: ["$prod.cost", 0] }, 0] },
                },
            },
            {
                $addFields: {
                    costTotal: { $multiply: ["$costUnit", "$quantity"] },
                    netRevenue: { $subtract: ["$revenue", { $multiply: ["$costUnit", "$quantity"] }] },
                },
            },
            { $project: { prod: 0 } },
            { $sort: { quantity: -1 } },
        ];

        const productStats = await Sale.aggregate(pipeline);

        // overall totals
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