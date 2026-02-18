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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import type { Employee } from '@/lib/data/employees';

const ROLE_OPTIONS = [
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'admin', label: 'Administrador' },
];

interface EmpleadosContentProps {
  initialEmployees: Employee[];
}

export function EmpleadosContent({ initialEmployees }: EmpleadosContentProps) {
  const router = useRouter();
  const [employeesList, setEmployeesList] = useState<Employee[]>(initialEmployees);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('vendedor');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  useEffect(() => {
    setEmployeesList(initialEmployees);
  }, [initialEmployees]);

  const resetForm = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('vendedor');
    setFormPhone('');
    setFormEmail('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (emp: Employee) => {
    setFormName(emp.name);
    setFormUsername(emp.username);
    setFormPassword('');
    setFormRole(emp.role);
    setFormPhone(emp.phone);
    setFormEmail(emp.email);
    setEditingId(emp.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!editingId && !formUsername.trim()) {
      toast.error('El nombre de usuario es obligatorio');
      return;
    }
    if (!editingId && (!formPassword || formPassword.length < 6)) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setIsSaving(true);
    try {
      const url = editingId ? `/api/employees/${editingId}` : '/api/employees';
      const method = editingId ? 'PUT' : 'POST';
      const bodyData: Record<string, string> = {
        name: formName.trim(),
        username: formUsername.trim(),
        role: formRole,
        phone: formPhone,
        email: formEmail,
      };
      if (formPassword) bodyData.password = formPassword;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(editingId ? 'Empleado actualizado' : 'Empleado creado');
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !emp.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(emp.active ? 'Empleado desactivado' : 'Empleado activado');
      router.refresh();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/employees/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Empleado eliminado');
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = employeesList.filter((e) => e.active).length;

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Empleados"
        description={`${employeesList.length} empleados registrados (${activeCount} activos)`}
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
              {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empName">Nombre *</Label>
                <Input
                  id="empName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empRole">Rol</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="empUsername">Usuario *</Label>
                <Input
                  id="empUsername"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="usuario123"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empPassword">
                  {editingId
                    ? 'Nueva contraseña (opcional)'
                    : 'Contraseña *'}
                </Label>
                <Input
                  id="empPassword"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={
                    editingId
                      ? 'Dejar vacío para no cambiar'
                      : 'Mínimo 6 caracteres'
                  }
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empPhone">Teléfono</Label>
                <Input
                  id="empPhone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+54 341 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empEmail">Email</Label>
                <Input
                  id="empEmail"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="empleado@negocio.com"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {editingId ? 'Guardar Cambios' : 'Crear Empleado'}
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
            <Plus className="h-4 w-4 mr-2" /> Nuevo Empleado
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {employeesList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay empleados registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesList.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className={!emp.active ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {emp.username}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted">
                          {ROLE_OPTIONS.find((r) => r.value === emp.role)
                            ?.label || emp.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.phone || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.email || '—'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(emp)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            emp.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {emp.active ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {emp.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(emp)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(emp.id)}
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
          title="Eliminar Empleado"
          description="¿Estás seguro de que querés eliminar este empleado? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          isLoading={isDeleting}
          variant="destructive"
        />
      )}
    </div>
  );
}
