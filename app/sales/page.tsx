import { getSales } from '@/lib/data/sales';
import SalesList from '../components/SalesList';

// Revalidate sales page every 30 seconds (ISR)
export const revalidate = 30;

export default async function SalesPage() {
  // Fetch sales server-side
  const sales = await getSales();

  return <SalesList initialSales={sales} />;
}
