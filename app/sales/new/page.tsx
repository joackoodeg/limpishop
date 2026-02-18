import { getProducts } from '@/lib/data/products';
import { getActiveEmployees, isEmpleadosEnabled } from '@/lib/data/employees';
import NewSaleForm from './NewSaleForm';

export default async function NewSalePage() {
  const [products, isEmpleados] = await Promise.all([
    getProducts(),
    isEmpleadosEnabled(),
  ]);

  const employees = isEmpleados ? await getActiveEmployees() : [];

  return <NewSaleForm products={products} employees={employees} />;
}
