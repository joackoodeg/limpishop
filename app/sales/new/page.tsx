'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  prices: { quantity: number; price: number }[];
  stock: number;
  description: string;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  variant: { quantity: number; price: number };
}

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [searchTerm, setSearchTerm] = useState('');
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);

    // Initialize selected variants to first option for each product
    const initialVariants: { [key: string]: number } = {};
    data.forEach((product: Product) => {
      if (product.prices && product.prices.length > 0) {
        initialVariants[product._id] = 0;
      }
    });
    setSelectedVariants(initialVariants);
  }

  function handleVariantChange(productId: string, variantIndex: number) {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantIndex
    }));
  }

  function addToCart(product: Product) {
    if (!product.prices || product.prices.length === 0) {
      alert('Este producto no tiene precios configurados');
      return;
    }

    const selectedVariantIndex = selectedVariants[product._id] || 0;
    const variant = product.prices[selectedVariantIndex];

    const existingItemIndex = cart.findIndex(
      item => item.productId === product._id && item.variant.quantity === variant.quantity
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        quantity: 1,
        price: variant.price,
        variant,
      };
      setCart([...cart, newItem]);
    }

    // Reset custom total when cart changes
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function removeFromCart(index: number) {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    // Reset custom total when cart changes
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
    // Reset custom total when cart changes
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function updateCartPrice(index: number, newPrice: number) {
    const newCart = [...cart];
    newCart[index].price = newPrice;
    setCart(newCart);
    // Reset custom total when individual prices change
    setCustomTotal(null);
    setIsEditingTotal(false);
  }

  function getCalculatedTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  function getFinalTotal() {
    return customTotal !== null ? customTotal : getCalculatedTotal();
  }

  function handleTotalEdit() {
    if (isEditingTotal) {
      setIsEditingTotal(false);
    } else {
      setCustomTotal(getCalculatedTotal());
      setIsEditingTotal(true);
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const finalTotal = getFinalTotal();

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          paymentMethod,
          grandTotal: finalTotal,
        }),
      });

      if (res.ok) {
        alert('Venta realizada con éxito');
        setCart([]);
        setCustomTotal(null);
        setIsEditingTotal(false);
        router.push('/sales');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la venta');
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Nueva Venta</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Productos</h2>

          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <div key={product._id} className="border rounded p-4 bg-white shadow-sm">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                <p className="text-sm text-gray-500 mb-3">Stock: {product.stock}</p>

                {product.prices && product.prices.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variación:
                    </label>
                    <select
                      value={selectedVariants[product._id] || 0}
                      onChange={(e) => handleVariantChange(product._id, parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {product.prices.map((variant, index) => (
                        <option key={index} value={index}>
                          {variant.quantity} unidad(es) - ${variant.price}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Carrito</h2>

          {cart.length === 0 ? (
            <p className="text-gray-500">El carrito está vacío</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="p-3 border rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.variant.quantity} unidad(es)
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div>
                        <label className="text-xs text-gray-600">Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-full border rounded px-2 py-1 text-center text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Precio c/u:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateCartPrice(index, parseFloat(e.target.value) || 0)}
                          className="w-full border rounded px-2 py-1 text-center text-sm"
                        />
                      </div>

                      <div className="text-center">
                        <label className="text-xs text-gray-600">Subtotal:</label>
                        <div className="font-medium text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4 p-3 bg-yellow-50 rounded">
                  <span className="text-xl font-semibold">Total:</span>
                  <div className="flex items-center gap-2">
                    {isEditingTotal ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customTotal || 0}
                        onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 0)}
                        className="border rounded px-2 py-1 text-center font-bold text-xl w-32"
                      />
                    ) : (
                      <span className="text-xl font-bold text-green-600">
                        ${getFinalTotal().toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={handleTotalEdit}
                      className="bg-orange-500 text-white px-2 py-1 rounded text-sm hover:bg-orange-600"
                    >
                      {isEditingTotal ? '✓' : 'Editar'}
                    </button>
                  </div>
                </div>

                {customTotal !== null && customTotal !== getCalculatedTotal() && (
                  <div className="mb-4 p-2 bg-orange-100 rounded text-sm">
                    <span className="font-medium text-orange-800">
                      💡 Precio especial aplicado
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Método de Pago:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-green-500 text-white py-3 rounded font-semibold hover:bg-green-600"
                >
                  Finalizar Venta - ${getFinalTotal().toFixed(2)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
