'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageHeader from './PageHeader';
import ConfirmDialog from './ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  X,
  Truck,
  Eye,
  DollarSign,
} from 'lucide-react';
import type { Supplier, SupplierBalance } from '@/lib/data/suppliers';

interface ProveedoresContentProps {
  initialSuppliers: (Supplier & { balance: SupplierBalance })[];
}

export function ProveedoresContent({ initialSuppliers }: ProveedoresContentProps) {
  const router = useRouter();
  const [suppliersList, setSuppliersList] = useState(initialSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    setSuppliersList(initialSuppliers);
  }, [initialSuppliers]);

  const resetForm = () => {
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormCity('');
    setFormTaxId('');
    setFormNotes('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s: Supplier) => {
    setFormName(s.name);
    setFormContact(s.contactName);
    setFormPhone(s.phone);
    setFormEmail(s.email);
    setFormAddress(s.address);
    setFormCity(s.city);
    setFormTaxId(s.taxId);
    setFormNotes(s.notes);
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PUT' : 'POST';
      const bodyData = {
        name: formName.trim(),
        contactName: formContact,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        city: formCity,
        taxId: formTaxId,
        notes: formNotes,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(editingId ? 'Proveedor actualizado' : 'Proveedor creado');
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (s: Supplier) => {
    try {
      const res = await fetch(`/api/suppliers/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !s.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(s.active ? 'Proveedor desactivado' : 'Proveedor activado');
      router.refresh();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Proveedor eliminado');
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = suppliersList.filter((s) => s.active).length;

  const formatCurrency = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const balanceBadge = (balance: SupplierBalance) => {
    if (balance.totalDebt === 0 && balance.totalPaid === 0) {
      return <Badge variant="secondary">Sin movimientos</Badge>;
    }
    if (balance.balance > 0) {
      return <Badge variant="destructive">Deuda: {formatCurrency(balance.balance)}</Badge>;
    }
    if (balance.balance < 0) {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">A favor: {formatCurrency(Math.abs(balance.balance))}</Badge>;
    }
    return <Badge className="bg-green-600 hover:bg-green-700 text-white">Al día</Badge>;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Proveedores"
        description={`${suppliersList.length} proveedores registrados (${activeCount} activos)`}
      />

      {showForm ? (
        <Card className="mb-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supName">Nombre / Razón social *</Label>
                <Input
                  id="supName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Distribuidora ABC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supContact">Persona de contacto</Label>
                <Input
                  id="supContact"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supPhone">Teléfono</Label>
                <Input
                  id="supPhone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+54 341 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supEmail">Email</Label>
                <Input
                  id="supEmail"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="proveedor@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supTaxId">CUIT / RUC</Label>
                <Input
                  id="supTaxId"
                  value={formTaxId}
                  onChange={(e) => setFormTaxId(e.target.value)}
                  placeholder="20-12345678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supCity">Ciudad</Label>
                <Input
                  id="supCity"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Rosario"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="supAddress">Dirección</Label>
                <Input
                  id="supAddress"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Av. Siempre Viva 742"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="supNotes">Notas</Label>
                <Textarea
                  id="supNotes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notas adicionales sobre el proveedor..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {editingId ? 'Guardar Cambios' : 'Crear Proveedor'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Proveedor
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {suppliersList.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay proveedores registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliersList.map((sup) => (
                    <TableRow
                      key={sup.id}
                      className={!sup.active ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-medium">{sup.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sup.contactName || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sup.phone || '—'}
                      </TableCell>
                      <TableCell>
                        {balanceBadge(sup.balance)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(sup)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            sup.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {sup.active ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {sup.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/proveedores/${sup.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(sup)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(sup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {deleteId && (
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Eliminar Proveedor"
          description="¿Estás seguro de que querés eliminar este proveedor? Se eliminarán también sus productos asociados y pagos registrados. Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          isLoading={isDeleting}
          variant="destructive"
        />
      )}
    </div>
  );
}
