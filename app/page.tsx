import { getDashboardStats } from '@/lib/data/dashboard';
import { getCurrentUser } from '@/lib/auth/session';
import { DashboardContent } from './components/DashboardContent';

export default async function HomePage() {
  const [stats, currentUser] = await Promise.all([
    getDashboardStats(),
    getCurrentUser(),
  ]);

  return (
    <DashboardContent
      stats={stats}
      userRole={currentUser?.role ?? null}
    />
  );
}
