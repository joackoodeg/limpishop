import { getStoreConfig } from '@/lib/data/config';
import { ConfigContent } from '../components/ConfigContent';

export default async function ConfigPage() {
  const config = await getStoreConfig();
  return <ConfigContent initialConfig={config} />;
}
