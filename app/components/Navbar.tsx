'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useStoreConfig } from '@/app/components/StoreConfigProvider';
import { ModeToggle } from './ModeToggle';

interface NavLink {
  href: string;
  label: string;
  module?: 'cajaDiaria' | 'empleados';
  adminOnly?: boolean;
}

const navLinks: NavLink[] = [
  { href: '/products', label: 'Productos', adminOnly: true },
  { href: '/stock', label: 'Stock', adminOnly: true },
  { href: '/categories', label: 'Categorías', adminOnly: true },
  { href: '/sales', label: 'Ventas' },
  { href: '/caja', label: 'Caja', module: 'cajaDiaria' },
  { href: '/empleados', label: 'Empleados', module: 'empleados', adminOnly: true },
  { href: '/resumen', label: 'Resumen', adminOnly: true },
  { href: '/catalogo', label: 'Catálogo', adminOnly: true },
  { href: '/combos', label: 'Combos', adminOnly: true },
  { href: '/config', label: 'Configuración', adminOnly: true },
];

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const NavIcon = ({ href }: { href: string }) => {
  const cls = 'h-5 w-5 flex-shrink-0';
  switch (href) {
    case '/products':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case '/stock':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case '/categories':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case '/sales':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case '/caja':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case '/empleados':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case '/resumen':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case '/catalogo':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case '/combos':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112-2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case '/config':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const Navbar = ({ children }: { children?: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string; employeeName: string | null } | null>(null);
  const { isModuleEnabled } = useStoreConfig();

  // Hydration-safe: read localStorage only on client
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('sidebar-open');
    if (stored !== null) setSidebarOpen(stored === 'true');
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.authenticated) {
          setCurrentUser({ role: data.role, employeeName: data.employeeName });
        }
      })
      .catch(() => {});
  }, []);

  const isEmployee = currentUser !== null && currentUser.role !== 'admin';

  const visibleLinks = navLinks.filter(link => {
    if (link.module && !isModuleEnabled(link.module)) return false;
    if (link.adminOnly && isEmployee) return false;
    return true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-open', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Default to open until client mounts (avoid layout shift)
  const open = mounted ? sidebarOpen : true;

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col border-r bg-background transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
          open ? 'w-60' : 'w-16'
        }`}
      >
        {/* Logo + toggle */}
        <div className="flex items-center h-14 border-b px-2 gap-2">
          {open ? (
            <Link href="/" className="flex-1 overflow-hidden">
              <img src="/images/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </Link>
          ) : (
            <div className="flex-1 flex justify-center">
              <Link href="/" title="Inicio">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent"
                >
                  <HomeIcon />
                </Button>
              </Link>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className={`flex-shrink-0 bg-primary/10 hover:bg-primary/20 border-primary/30 ${!open ? 'mx-auto' : ''}`}
            aria-label={open ? 'Colapsar menú' : 'Expandir menú'}
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto overflow-x-hidden">
          {visibleLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              title={!open ? link.label : undefined}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${!open ? 'justify-center' : ''}`}
            >
              <NavIcon href={link.href} />
              {open && <span className="truncate">{link.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User + theme + logout */}
        <div className="border-t p-2 flex flex-col gap-1">
          {currentUser && open && (
            <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground truncate">
              {isEmployee ? currentUser.employeeName : 'Admin'}
            </span>
          )}
          <div className={`flex items-center gap-2 px-2 py-1 ${!open ? 'justify-center' : ''}`}>
            {open && <span className="text-sm text-muted-foreground">Tema</span>}
            <ModeToggle />
          </div>
          <button
            onClick={handleLogout}
            title={!open ? 'Cerrar sesión' : undefined}
            className={`flex items-center gap-3 px-2 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors ${
              !open ? 'justify-center' : ''
            }`}
          >
            <LogoutIcon />
            {open && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Right side ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/">
              <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
            </Link>

            <div className="flex items-center gap-1">
              <ModeToggle />
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Menú">
                    <HamburgerIcon />
                  </Button>
                </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-left">Menú</SheetTitle>
                  {currentUser && (
                    <p className="text-xs text-muted-foreground text-left">
                      {isEmployee ? `Empleado: ${currentUser.employeeName}` : 'Administrador'}
                    </p>
                  )}
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-6">
                  {visibleLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <NavIcon href={link.href} />
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogoutIcon />
                    Cerrar sesión
                  </button>
                </div>
              </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
};

export default Navbar;
