import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';
import { db } from '@/lib/db';
import { employees, storeConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';

const { APP_PASSWORD, JWT_SECRET } = process.env;

export async function POST(req: Request) {
  const body = await req.json();
  const { password, username } = body;

  // ── Employee login ──────────────────────────────────────────────────────
  if (username) {
    // Check if the employees module is enabled
    const configRows = await db.select().from(storeConfig).limit(1);
    const modules = configRows.length > 0
      ? JSON.parse(configRows[0].enabledModules || '{}')
      : {};

    if (!modules.empleados) {
      return new NextResponse(JSON.stringify({ message: 'Módulo de empleados no habilitado' }), { status: 403 });
    }

    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.username, username.trim()))
      .limit(1);

    if (!employee || !employee.active) {
      return new NextResponse(JSON.stringify({ message: 'Usuario o contraseña incorrectos' }), { status: 401 });
    }

    const isValid = await verifyPassword(password, employee.password);
    if (!isValid) {
      return new NextResponse(JSON.stringify({ message: 'Usuario o contraseña incorrectos' }), { status: 401 });
    }

    const token = sign(
      { role: employee.role, employeeId: employee.id, employeeName: employee.name },
      JWT_SECRET as string,
      { expiresIn: '8h' },
    );

    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return new NextResponse(
      JSON.stringify({ message: 'Autenticado', role: employee.role, name: employee.name }),
      { status: 200, headers: { 'Set-Cookie': cookie } },
    );
  }

  // ── Admin login ─────────────────────────────────────────────────────────
  if (password === APP_PASSWORD) {
    const token = sign({ role: 'admin', employeeId: null, employeeName: null }, JWT_SECRET as string, {
      expiresIn: '8h',
    });

    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return new NextResponse(JSON.stringify({ message: 'Autenticado', role: 'admin' }), {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    });
  }

  return new NextResponse(JSON.stringify({ message: 'No autorizado' }), {
    status: 401,
  });
}
