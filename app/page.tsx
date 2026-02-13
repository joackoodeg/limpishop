import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Bienvenido a Limpi</h1>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Link href="/products" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 w-full sm:w-auto">
          Productos
        </Link>
        <Link href="/categories" className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 w-full sm:w-auto">
          Categorías
        </Link>
        <Link href="/sales" className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 w-full sm:w-auto">
          Ver Ventas
        </Link>
        <Link href="/reports" className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 w-full sm:w-auto">
          Ver Reportes
        </Link>
        <Link href="/sales/summary" className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 w-full sm:w-auto">
          Ver Resumen de Ventas
        </Link>
        <Link href="/combos" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 w-full sm:w-auto">
          Gestionar Combos
        </Link>
      </div>
    </div>
  );
}
