'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditProductPage() {
  const [name, setName] = useState('');
  const [prices, setPrices] = useState([{ quantity: 1, price: '' }]);
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { id } = params;

  useEffect(() => {
    if (id) {
      async function fetchProduct() {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) return;
        const product = await res.json();
        if (product) {
          setName(product.name);
          setPrices(product.prices && product.prices.length > 0 ? product.prices : [{ quantity: 1, price: '' }]);
          setCost(product.cost ?? '');
          setStock(product.stock);
          setDescription(product.description ?? '');
          setActive(product.active ?? true);
          setFeatured(product.featured ?? false);
          setCategoryId(product.categoryId ?? null);
        }
      }
      fetchProduct();
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prices, cost, stock, description, active, featured, categoryId }),
    });
    router.push('/products');
  }

  function handlePriceChange(index, field, value) {
    const newPrices = [...prices];
    newPrices[index][field] = value;
    setPrices(newPrices);
  }

  function addPriceField() {
    setPrices([...prices, { quantity: 1, price: '' }]);
  }

  function removePriceField(index) {
    const newPrices = prices.filter((_, i) => i !== index);
    setPrices(newPrices);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Editar Producto</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Precios</label>
          {prices.map((p, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="number"
                placeholder="Cantidad"
                value={p.quantity}
                onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                className="shadow appearance-none border rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                required
              />
              <input
                type="number"
                placeholder="Precio"
                value={p.price}
                onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                className="shadow appearance-none border rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                required
              />
              {prices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePriceField(index)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPriceField}
            className="bg-green-500 text-white px-4 py-2 rounded mt-2"
          >
            Añadir Precio
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cost">
            Costo Unitario
          </label>
          <input
            id="cost"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock">
            Stock
          </label>
          <input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Actualizar
        </button>
      </form>
    </div>
  );
}
