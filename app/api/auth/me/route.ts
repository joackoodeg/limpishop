import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({
      authenticated: true,
      role: payload.role as string,
      employeeId: (payload.employeeId as number) ?? null,
      employeeName: (payload.employeeName as string) ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
