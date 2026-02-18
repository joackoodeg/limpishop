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
import {
  Package,
  Boxes,
  Tags,
  ShoppingCart,
  Wallet,
  Users,
  BarChart3,
  Grid3x3,
  Combine,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
  { href: '/catalogo', label: 'Catálogo / Reportes PDF', adminOnly: true },
  { href: '/combos', label: 'Combos', adminOnly: true },
  { href: '/config', label: 'Configuración', adminOnly: true },
];

// ── Icons using lucide-react ─────────────────────────────────────────────────
const NavIcon = ({ href }: { href: string }) => {
  const iconProps = { size: 20, className: 'flex-shrink-0' };
  switch (href) {
    case '/products':
      return <Package {...iconProps} />;
    case '/stock':
      return <Boxes {...iconProps} />;
    case '/categories':
      return <Tags {...iconProps} />;
    case '/sales':
      return <ShoppingCart {...iconProps} />;
    case '/caja':
      return <Wallet {...iconProps} />;
    case '/empleados':
      return <Users {...iconProps} />;
    case '/resumen':
      return <BarChart3 {...iconProps} />;
    case '/catalogo':
      return <Grid3x3 {...iconProps} />;
    case '/reports':
      return <BarChart3 {...iconProps} />;
    case '/combos':
      return <Combine {...iconProps} />;
    case '/config':
      return <Settings {...iconProps} />;
    default:
      return null;
  }
};

const HamburgerIcon = () => <Menu size={24} className="flex-shrink-0" />;

const LogoutIcon = () => <LogOut size={20} className="flex-shrink-0" />;

const ChevronLeftIcon = () => <ChevronLeft size={20} className="flex-shrink-0" />;

const ChevronRightIcon = () => <ChevronRight size={20} className="flex-shrink-0" />;

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
          {open && (
            <Link href="/" className="flex-1 overflow-hidden">
              <img src="/images/logo.png" alt="Logo" className="h-20 w-auto object-contain" />
            </Link>
          )}
          <div className="flex items-center gap-1">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={`flex-shrink-0 ${!open ? 'mx-auto' : ''}`}
              aria-label={open ? 'Colapsar menú' : 'Expandir menú'}
            >
              {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </Button>
          </div>
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

        {/* User + logout */}
        <div className="border-t p-2 flex flex-col gap-1">
          {currentUser && open && (
            <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground truncate">
              {isEmployee ? currentUser.employeeName : 'Admin'}
            </span>
          )}
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
