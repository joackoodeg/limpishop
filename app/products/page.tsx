import { getProducts, getCategories } from '@/lib/data/products';
import ProductsList from '../components/ProductsList';

// Revalidate products page every 60 seconds (ISR)
export const revalidate = 60;

export default async function ProductsPage() {
  // Fetch products and categories server-side in parallel
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <ProductsList initialProducts={products} categories={categories} />;
}
