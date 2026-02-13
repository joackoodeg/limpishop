'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Gift, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export default function CombosPage() {
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCombos(); }, []);

  const fetchCombos = async () => {
    try {
      const response = await fetch('/api/combos');
      const data = await response.json();
      setCombos(data);
    } catch {
      toast.error('Error al cargar combos');
    } finally {
      setLoading(false);
    }
  };

  const {
    paginatedItems: paginatedCombos,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageSizeOptions,
    itemRange,
    hasNextPage,
    hasPrevPage,
    goToPage,
    setPageSize,
  } = usePagination(combos, { defaultPageSize: 10 });

  const toggleComboStatus = async (id: number, currentStatus: boolean) => {
    try {
      const combo = combos.find(c => c.id === id);
      const response = await fetch(`/api/combos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...combo, active: !currentStatus }),
      });
      if (response.ok) {
        fetchCombos();
        toast.success('Estado actualizado');
      }
    } catch {
      toast.error('Error al actualizar combo');
    }
  };

  const deleteCombo = async (id: number) => {
    try {
      const response = await fetch(`/api/combos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCombos();
        toast.success('Combo eliminado');
      }
    } catch {
      toast.error('Error al eliminar combo');
    }
  };

  const generateCombosPDF = async () => {
    const doc = new jsPDF();
    let currentY = 55;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Obtener configuración del local
    let storeConfig = { storeName: 'El Limpito', phone: '342-486-9674', address: '', logoUrl: '' };
    try {
      const configResponse = await fetch('/api/config');
      if (configResponse.ok) {
        storeConfig = await configResponse.json();
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }

    try {
      const img = new Image();
      img.src = storeConfig.logoUrl || '/logo.jpg';
      await new Promise((resolve) => {
        img.onload = () => { doc.addImage(img, 'JPEG', 20, 10, 30, 30); resolve(true); };
        img.onerror = () => resolve(true);
      });
    } catch { /* ignore */ }

    doc.setFontSize(20); doc.setTextColor(40);
    doc.text(`Lista de Combos - ${storeConfig.storeName}`, 60, 25);
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text(`WhatsApp: ${storeConfig.phone}`, 60, 35);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text('Combos disponibles con ofertas especiales', 60, 42);
    if (storeConfig.address) {
      doc.setFontSize(9);
      doc.text(storeConfig.address, 60, 47);
    }

    const activeCombos = combos.filter((combo: any) => combo.active);

    if (activeCombos.length === 0) {
      doc.setFontSize(14); doc.setTextColor(100);
      doc.text('No hay combos activos disponibles', margin, currentY);
    } else {
      activeCombos.forEach((combo: any, index: number) => {
        if (currentY > pageHeight - 100) { doc.addPage(); currentY = 30; }
        doc.setFontSize(16); doc.setTextColor(40);
        doc.text(combo.name.charAt(0).toUpperCase() + combo.name.slice(1), margin, currentY);
        currentY += 10;
        if (combo.description) { doc.setFontSize(11); doc.setTextColor(80); doc.text(combo.description, margin, currentY); currentY += 8; }

        const originalPrice = combo.originalPrice?.toFixed(2) || '0.00';
        const finalPrice = combo.finalPrice?.toFixed(2) || '0.00';
        const discount = combo.discountPercentage || 0;

        const tableData: string[][] = [];
        combo.products?.forEach((p: any) => {
          tableData.push([p.productName, p.quantity.toString(), `$${p.price?.toFixed(2) || '0.00'}`, `$${(p.price * p.quantity).toFixed(2)}`]);
        });
        tableData.push(['', '', 'SUBTOTAL:', `$${originalPrice}`]);
        if (discount > 0) {
          tableData.push([`DESCUENTO ${discount}%:`, '', `Antes: $${originalPrice}`, `$${finalPrice}`]);
        } else {
          tableData.push(['PRECIO FINAL:', '', '', `$${finalPrice}`]);
        }

        autoTable(doc, {
          head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
          body: tableData,
          startY: currentY,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontSize: 10, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } },
          didParseCell: function (data) {
            if (data.row.index === tableData.length - 2) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [248, 249, 250];
            }
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [220, 255, 220];
              if (discount > 0 && data.column.index === 2) { data.cell.styles.textColor = [150, 150, 150]; data.cell.styles.fontSize = 8; }
              else { data.cell.styles.textColor = [0, 100, 0]; }
              if (data.column.index === 3) { data.cell.styles.textColor = [0, 100, 0]; data.cell.styles.fontSize = 11; }
            }
          },
          margin: { left: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
        if (index < activeCombos.length - 1) { doc.setDrawColor(200, 200, 200); doc.line(margin, currentY, 190, currentY); currentY += 10; }
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} | ${storeConfig.phone ? 'WhatsApp: ' + storeConfig.phone : storeConfig.storeName}`, margin, pageHeight - 10);
    }

    doc.save(`${storeConfig.storeName}-Combos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div>
      <PageHeader title="Gestión de Combos">
        <Button variant="secondary" onClick={generateCombosPDF} disabled={loading || combos.length === 0}>
          Crear PDF
        </Button>
        <Button asChild>
          <Link href="/combos/new">Crear Combo</Link>
        </Button>
      </PageHeader>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 space-y-3"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))}
        </div>
      )}

      {!loading && combos.length === 0 && (
        <EmptyState
          icon={<Gift className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
          title="No hay combos creados"
          description="Crea tu primer combo con descuento"
          actionLabel="Crear Combo"
          actionHref="/combos/new"
        />
      )}

      {!loading && combos.length > 0 && (
        <div className="space-y-3">
          {paginatedCombos.map((combo: any) => (
            <Card key={combo.id}>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{combo.name}</h3>
                      <StatusBadge type={combo.active ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{combo.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Original:</span> ${combo.originalPrice?.toFixed(2)}</div>
                      <div><span className="text-muted-foreground">Descuento:</span> {combo.discountPercentage}%</div>
                      <div><span className="font-semibold text-emerald-600">Final: ${combo.finalPrice?.toFixed(2)}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Productos: {combo.products?.map((p: any) => `${p.productName} (${p.quantity})`).join(', ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-start">
                    <Button size="sm" variant="info" asChild>
                      <Link href={`/combos/${combo.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Ver
                      </Link>
                    </Button>
                    <Button size="sm" variant="warning" asChild>
                      <Link href={`/combos/${combo.id}/edit`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant={combo.active ? 'secondary' : 'success'}
                      onClick={() => toggleComboStatus(combo.id, combo.active)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {combo.active ? (
                          <>
                            <PowerOff className="h-4 w-4" aria-hidden="true" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4" aria-hidden="true" />
                            Activar
                          </>
                        )}
                      </span>
                    </Button>
                    <ConfirmDialog description="¿Eliminar este combo?" onConfirm={() => deleteCombo(combo.id)} confirmLabel="Eliminar">
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && combos.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          itemRange={itemRange}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          itemLabel="combos"
        />
      )}
    </div>
  );
}
