import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
  });

  return new NextResponse(JSON.stringify({ message: 'Sesión cerrada' }), {
    status: 200,
    headers: { 'Set-Cookie': cookie },
  });
}
