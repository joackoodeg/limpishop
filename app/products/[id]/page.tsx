'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductDetailsPage() {
  interface Price {
    quantity: number;
    price: number;
  }

  interface Product {
    id: number;
    name: string;
    prices: Price[];
    cost?: number;
    stock: number;
    description?: string;
  }

  const [product, setProduct] = useState<Product | null>(null);
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      async function fetchProduct() {
        const res = await fetch(`/api/products`);
        const products = await res.json();
        const product = products.find(p => p.id === Number(id));
        setProduct(product);
      }
      fetchProduct();
    }
  }, [id]);

  async function handleDelete() {
    if (!product) return;
    const ok = confirm('¿Seguro que deseas eliminar este producto?');
    if (ok) {
      await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      router.push('/products');
    }
  }

  if (!product) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Precios</h2>
          <ul>
            {product.prices && product.prices.map((p, index) => (
              <li key={index} className="text-gray-700">
                {p.quantity} unidad(es) - ${p.price}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-gray-700 mb-2"><strong>Costo:</strong> ${product.cost}</p>
        <p className="text-gray-700 mb-2"><strong>Stock:</strong> {product.stock}</p>
        <p className="text-gray-700 mb-4"><strong>Descripción:</strong> {product.description}</p>
        <div className="flex space-x-2">
          <Link href={`/products/${product.id}/edit`} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
            Editar
          </Link>
          <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Eliminar
          </button>
          <button onClick={() => router.back()} className="bg-gray-500 text-white px-4 py-2 rounded">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
