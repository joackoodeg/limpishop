import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // Permitir el acceso a la página de login y a las API de autenticación
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Forward user info as headers so API routes and Server Components can read them
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-role', (payload.role as string) ?? 'admin');
    requestHeaders.set('x-employee-id', String(payload.employeeId ?? ''));
    requestHeaders.set('x-employee-name', (payload.employeeName as string) ?? '');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
