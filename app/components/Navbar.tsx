'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 text-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          Limpi
        </Link>
        <div className="flex items-center space-x-2">
          <Link href="/products" className="text-gray-300 hover:text-white">
            Productos
          </Link>
          <Link href="/categories" className="text-gray-300 hover:text-white">
            Categorías
          </Link>
          <Link href="/sales" className="text-gray-300 hover:text-white">
            Ventas
          </Link>
          <Link href="/sales/summary" className="text-gray-300 hover:text-white">
            Resumen
          </Link>
          <Link href="/reports" className="text-gray-300 hover:text-white">
            Reportes
          </Link>
          <Link href="/combos" className="text-gray-300 hover:text-white">
            Combos
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-label="Cerrar sesión"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
