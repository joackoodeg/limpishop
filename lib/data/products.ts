import { db } from '@/lib/db';
import { products, productPrices, categories } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export interface Price {
  quantity: number;
  price: number;
}

export interface Product {
  id: number;
  name: string;
  prices: Price[];
  stock: number;
  unit: string;
  description: string;
  active: boolean;
  featured: boolean;
  categoryName?: string;
  categoryId?: number;
  cost?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Fetch all products with their prices server-side
 * Optimized with parallel queries to avoid N+1 problem
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const allProducts = await db.select().from(products).orderBy(products.name);

    // Fetch prices only for the retrieved products (optimized)
    const allPrices = allProducts.length > 0
      ? await db.select().from(productPrices)
          .where(inArray(productPrices.productId, allProducts.map(p => p.id)))
      : [];

    // Group prices by product ID
    const pricesByProduct: Record<number, Price[]> = {};
    for (const pp of allPrices) {
      if (!pricesByProduct[pp.productId]) {
        pricesByProduct[pp.productId] = [];
      }
      pricesByProduct[pp.productId].push({
        quantity: pp.quantity,
        price: pp.price,
      });
    }

    // Combine products with their prices
    const result: Product[] = allProducts.map(p => ({
      id: p.id,
      name: p.name,
      prices: pricesByProduct[p.id] || [],
      stock: p.stock,
      unit: p.unit,
      description: p.description,
      active: p.active,
      featured: p.featured,
      categoryName: p.categoryName,
      categoryId: p.categoryId,
      cost: p.cost,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return result;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Fetch all categories server-side
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    return allCategories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch a single product by ID with its prices
 */
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    
    if (!product) {
      return null;
    }

    const prices = await db.select().from(productPrices).where(eq(productPrices.productId, id));

    return {
      id: product.id,
      name: product.name,
      prices: prices.map(p => ({ quantity: p.quantity, price: p.price })),
      stock: product.stock,
      unit: product.unit,
      description: product.description,
      active: product.active,
      featured: product.featured,
      categoryName: product.categoryName,
      categoryId: product.categoryId,
      cost: product.cost,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}
