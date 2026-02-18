import { getCategories } from '@/lib/data/products';
import { CategoriesContent } from '../components/CategoriesContent';

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesContent initialCategories={categories} />;
}
