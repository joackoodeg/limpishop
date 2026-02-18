import { headers } from 'next/headers';

/**
 * Get current user from request headers set by middleware (after JWT verification).
 * Use in Server Components only.
 */
export async function getCurrentUser(): Promise<{ role: string } | null> {
  const headersList = await headers();
  const role = headersList.get('x-user-role');
  if (!role) return null;
  return { role };
}
