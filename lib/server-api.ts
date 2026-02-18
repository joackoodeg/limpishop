import { headers } from 'next/headers';

/**
 * Base URL for server-side fetch to app API routes.
 * Use in Server Components only.
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}
