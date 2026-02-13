import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';

const { APP_PASSWORD, JWT_SECRET } = process.env;

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === APP_PASSWORD) {
    const token = sign({ user: 'admin' }, JWT_SECRET as string, {
      expiresIn: '1h',
    });

    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hora
    });

    return new NextResponse(JSON.stringify({ message: 'Autenticado' }), {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    });
  }

  return new NextResponse(JSON.stringify({ message: 'No autorizado' }), {
    status: 401,
  });
}
