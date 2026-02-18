import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/data/products';
import { getStockMovements } from '@/lib/data/stock';
import { ProductDetailContent } from '../../components/ProductDetailContent';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) return { title: 'Producto no encontrado' };
  return {
    title: product.name,
    description: product.description ?? `Detalle del producto ${product.name}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) notFound();

  const [product, stockMovements] = await Promise.all([
    getProductById(productId),
    getStockMovements(productId, 5),
  ]);

  if (!product) notFound();

  return (
    <ProductDetailContent product={product} stockMovements={stockMovements} />
  );
}
