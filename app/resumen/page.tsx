import { getSalesSummary, getSales } from '@/lib/data/sales';
import { ResumenContent } from '../components/ResumenContent';
import { getTodayDateString } from '@/lib/utils/date';

interface ResumenPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function getPresetFromParams(from?: string, to?: string): 'today' | 'week' | 'month' | 'year' | 'custom' {
  const today = getTodayDateString();
  if (!from && !to) return 'today';
  if (from === today && to === today) return 'today';
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekFrom = weekAgo.toISOString().split('T')[0];
  if (from === weekFrom && to === today) return 'week';
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthFrom = monthAgo.toISOString().split('T')[0];
  if (from === monthFrom && to === today) return 'month';
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearFrom = yearAgo.toISOString().split('T')[0];
  if (from === yearFrom && to === today) return 'year';
  return 'custom';
}

export default async function ResumenPage({ searchParams }: ResumenPageProps) {
  const params = await searchParams;
  const today = getTodayDateString();
  const fromParam = params.from ?? today;
  const toParam = params.to ?? today;

  const [summary, sales] = await Promise.all([
    getSalesSummary({ from: fromParam, to: toParam }),
    getSales({ from: fromParam, to: toParam }),
  ]);

  const activePreset = getPresetFromParams(fromParam, toParam);

  return (
    <ResumenContent
      initialSummary={summary}
      initialSales={sales}
      fromParam={fromParam}
      toParam={toParam}
      activePreset={activePreset}
    />
  );
}
