import { getCombos } from '@/lib/data/combos';
import { CombosListContent } from '../components/CombosListContent';

export default async function CombosPage() {
  const combos = await getCombos();
  return <CombosListContent initialCombos={combos} />;
}
