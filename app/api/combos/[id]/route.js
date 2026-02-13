import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Combo from '@/models/Combo';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid combo ID' }, { status: 400 });
        }
        
        const combo = await Combo.findById(id);

        if (!combo) {
            return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
        }

        return NextResponse.json(combo);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error fetching combo' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid combo ID' }, { status: 400 });
        }
        
        const { name, description, products, originalPrice, discountPercentage, finalPrice, active } = await request.json();

        const combo = await Combo.findByIdAndUpdate(
            id,
            {
                name,
                description,
                products,
                originalPrice: Number(originalPrice),
                discountPercentage: Number(discountPercentage),
                finalPrice: Number(finalPrice),
                active: Boolean(active)
            },
            { new: true, runValidators: true }
        );

        if (!combo) {
            return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
        }

        return NextResponse.json(combo);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error updating combo' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid combo ID' }, { status: 400 });
        }
        
        const combo = await Combo.findByIdAndDelete(id);

        if (!combo) {
            return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Combo deleted successfully' });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error deleting combo' }, { status: 500 });
    }
} 