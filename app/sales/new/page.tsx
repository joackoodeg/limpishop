import { getProducts } from '@/lib/data/products';
import { getActiveEmployees, isEmpleadosEnabled } from '@/lib/data/employees';
import { getCombos } from '@/lib/data/combos';
import NewSaleForm from './NewSaleForm';

export default async function NewSalePage() {
  const [products, isEmpleados, allCombos] = await Promise.all([
    getProducts(),
    isEmpleadosEnabled(),
    getCombos(),
  ]);

  const employees = isEmpleados ? await getActiveEmployees() : [];
  const activeCombos = allCombos.filter((c) => c.active);

  return <NewSaleForm products={products} employees={employees} combos={activeCombos} />;
}
