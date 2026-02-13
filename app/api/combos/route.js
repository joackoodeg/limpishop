import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Combo from '@/models/Combo';

export async function GET() {
    try {
        await connectDB();
        const combos = await Combo.find({}).sort({ name: 1 });
        return NextResponse.json(combos);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error fetching combos' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const { name, description, products, originalPrice, discountPercentage, finalPrice } = await request.json();

        const combo = new Combo({
            name,
            description,
            products,
            originalPrice: Number(originalPrice),
            discountPercentage: Number(discountPercentage),
            finalPrice: Number(finalPrice),
            active: true
        });

        await combo.save();
        return NextResponse.json(combo, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error creating combo' }, { status: 500 });
    }
} 