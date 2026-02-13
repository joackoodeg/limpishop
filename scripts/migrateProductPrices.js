const mongoose = require('mongoose');

// Load environment variables (if `.env.local` is present and dotenv is installed)
try {
    // Optional dependency – script still works if dotenv is not installed
    require('dotenv').config();
} catch (_) {
    /* ignore */
}

const uri = process.env.MONGODB_URI;
if (!uri) {
    // eslint-disable-next-line no-console
    console.error('Error: MONGODB_URI environment variable not set.');
    process.exit(1);
}

// Define minimal schema for migration
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    prices: [{
        quantity: Number,
        price: Number
    }]
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

async function migrate() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB with Mongoose');

        // Find products that still use the old schema (have `price` but not `prices`)
        const products = await Product.find({ 
            price: { $exists: true }, 
            prices: { $exists: false } 
        });

        let migratedCount = 0;

        for (const product of products) {
            const oldPrice = parseFloat(product.price);
            if (Number.isNaN(oldPrice)) {
                // Skip documents with non-numeric price
                console.warn(`Skipping product ${product._id} – invalid price: ${product.price}`);
                continue;
            }

            // Determine quantity based on product name/title
            const name = (product.name || '').toLowerCase();
            let quantity = 1;
            if (name.includes('5l')) {
                quantity = 5;
            } else if (name.includes('medio litro')) {
                quantity = 0.5;
            } else if (name.includes('u')) {
                // "U" (unidad)
                quantity = 1;
            }

            // Update using Mongoose
            await Product.findByIdAndUpdate(product._id, {
                $set: {
                    prices: [{ quantity, price: oldPrice }],
                },
                $unset: {
                    price: 1 // Remove the old price field
                }
            });

            migratedCount += 1;
            console.log(`Migrated product ${product._id} → quantity ${quantity}, price ${oldPrice}`);
        }

        console.log(`Migration completed. ${migratedCount} product(s) updated.`);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrate(); 