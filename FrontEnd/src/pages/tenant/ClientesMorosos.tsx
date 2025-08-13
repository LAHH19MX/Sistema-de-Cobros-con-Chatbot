import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CellDef, RowInput } from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { 
  getMorosos, 
  enviarNotificacionMoroso,
  generarReporteMorosos
} from '../../api/morososTenant';
import type { ClienteMoroso, ReporteMorosos } from '../../api/morososTenant';
import '../../styles/tenant/MorososTenant.css';

// Extender jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const MorososTenant: React.FC = () => {
  const [morosos, setMorosos] = useState<ClienteMoroso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [filtros, setFiltros] = useState({
    dias_retraso: '',
    rango_monto: '0',
    orden: 'mayor_deuda'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    const cargarMorosos = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          page: pagination.page,
          limit: pagination.limit
        };

        // Filtro de días de atraso
        if (filtros.dias_retraso && filtros.dias_retraso !== '') {
          params.dias_retraso = Number(filtros.dias_retraso);
        }

        // Filtro de rango de monto
        if (filtros.rango_monto && filtros.rango_monto !== '0') {
          switch (filtros.rango_monto) {
            case '1': // $0 - $5,000
              params.monto_max = 5000;
              break;
            case '2': // $5,001 - $15,000
              params.monto_min = 5001;
              params.monto_max = 15000;
              break;
            case '3': // $15,001 - $30,000
              params.monto_min = 15001;
              params.monto_max = 30000;
              break;
            case '4': // Más de $30,000
              params.monto_min = 30001;
              break;
          }
        }

        console.log('Parámetros enviados al backend:', params);
        
        const response = await getMorosos(params);
        
        // Ordenar en el frontend según la opción seleccionada
        let morososOrdenados = [...response.data.data];
        
        switch (filtros.orden) {
          case 'mayor_deuda':
            morososOrdenados.sort((a, b) => b.montoTotal - a.montoTotal);
            break;
          case 'menor_deuda':
            morososOrdenados.sort((a, b) => a.montoTotal - b.montoTotal);
            break;
          case 'mas_dias':
            morososOrdenados.sort((a, b) => b.diasRetrasoMaximo - a.diasRetrasoMaximo);
            break;
          case 'menos_dias':
            morososOrdenados.sort((a, b) => a.diasRetrasoMaximo - b.diasRetrasoMaximo);
            break;
          default:
            // No ordenar, mantener orden del backend
            break;
        }
        
        setMorosos(morososOrdenados);
        setPagination(response.data.pagination);
      } catch (err) {
        setError('Error cargando clientes morosos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarMorosos();
  }, [filtros, pagination.page]);

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Generar reporte PDF
 const generarReportePDF = (data: ReporteMorosos, filtros: any) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuración de márgenes
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = margin;
      
      // Título de la empresa (centrado)
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      const title = data.empresa?.nombre || 'Mi Empresa';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, currentY);
      currentY += 10;
      
      // Primera línea: Reporte de morosos y Formato PDF
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Izquierda: "Reporte de clientes morosos"
      doc.text('Reporte de clientes morosos', margin, currentY);
      
      // Derecha: "Formato PDF"
      const formatoText = 'Formato PDF';
      const formatoWidth = doc.getTextWidth(formatoText);
      doc.text(formatoText, pageWidth - margin - formatoWidth, currentY);
      currentY += 8;
      
      // Segunda línea: Por: [nombre] y Generado el: [fecha]
      const generadoPor = `Por: ${data.inquilino.nombre} ${data.inquilino.apellidoPaterno} ${data.inquilino.apellidoMaterno}`;
      const fechaGeneracion = `Generado el: ${formatFecha(data.fechaGeneracion)}`;
      doc.text(generadoPor, margin, currentY);
      
      const fechaWidth = doc.getTextWidth(fechaGeneracion);
      doc.text(fechaGeneracion, pageWidth - margin - fechaWidth, currentY);
      currentY += 15;
      
      // Información de filtros aplicados
      let yPos = currentY;
      if (filtros.desde && filtros.hasta) {
        doc.text(`Período: ${formatFecha(filtros.desde)} - ${formatFecha(filtros.hasta)}`, margin, yPos);
        yPos += 5;
      }
      if (filtros.dias_retraso) {
        doc.text(`Días mínimos de atraso: ${filtros.dias_retraso}`, margin, yPos);
        yPos += 5;
      }
      if (filtros.monto_min) {
        doc.text(`Monto mínimo: ${formatCurrency(filtros.monto_min)}`, margin, yPos);
        yPos += 5;
      }
      
      // Tabla con bordes negros
      const headers: CellDef[] = [
        { content: 'Cliente', styles: { fontStyle: 'bold', fillColor: [220, 53, 69], textColor: 255 } },
        { content: 'Email', styles: { fontStyle: 'bold', fillColor: [220, 53, 69], textColor: 255 } },
        { content: 'Fecha Vencimiento', styles: { fontStyle: 'bold', fillColor: [220, 53, 69], textColor: 255 } },
        { content: 'Días Atraso', styles: { fontStyle: 'bold', fillColor: [220, 53, 69], textColor: 255 } },
        { content: 'Monto Adeudado', styles: { fontStyle: 'bold', fillColor: [220, 53, 69], textColor: 255 } }
      ];
      
      const body: RowInput[] = data.datos.map(moroso => [
        `${moroso.nombre} ${moroso.apellidoPaterno} ${moroso.apellidoMaterno}`,
        moroso.email,
        formatFecha(moroso.fechaVencimiento),
        `${moroso.diasRetraso} días`,
        formatCurrency(moroso.monto)
      ]);
      
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: yPos + 5,
        theme: 'grid', // Bordes completos
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [0, 0, 0], // Bordes negros
          lineWidth: 0.2,
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: 255,
          fontStyle: 'bold',
          lineWidth: 0.3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: margin, right: margin }
      });
      
      // Resumen al final
      const finalY = doc.lastAutoTable.finalY + 10;
      const totalMonto = data.datos.reduce((sum, moroso) => sum + moroso.monto, 0);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN FINAL', margin, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de morosos: ${data.datos.length}`, margin, finalY + 8);
      doc.text(`Total adeudado: ${formatCurrency(totalMonto)}`, margin, finalY + 16);
      
      // Descargar PDF
      const fileName = `reporte-morosos-${filtros.desde || 'todos'}-${filtros.hasta || 'todos'}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error en generarReportePDF:', error);
      throw error;
    }
  };

  // Generar reporte Excel
  const generarReporteExcel = (data: ReporteMorosos, filtros: any) => {
    try {
      // Calcular totales
      const totalMonto = data.datos.reduce((sum, moroso) => sum + moroso.monto, 0);
      
      // Crear libro de trabajo
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet([]);
      
      // 1. Encabezado principal
      utils.sheet_add_aoa(ws, [[data.empresa?.nombre || "Mi Empresa"]], { origin: "A1" });
      utils.sheet_add_aoa(ws, [["Reporte de Clientes Morosos"]], { origin: "A2" });
      
      // 2. Información de generación
      utils.sheet_add_aoa(ws, [
        ["Generado por:", `${data.inquilino.nombre} ${data.inquilino.apellidoPaterno} ${data.inquilino.apellidoMaterno}`],
        ["Generado el:", formatFecha(data.fechaGeneracion)],
        ["Formato:", "Excel"]
      ], { origin: "A4" });
      
      // 3. Filtros aplicados
      utils.sheet_add_aoa(ws, [["FILTROS APLICADOS"]], { origin: "A7" });
      let row = 8;
      
      if (filtros.desde && filtros.hasta) {
        utils.sheet_add_aoa(ws, [[`Período: ${formatFecha(filtros.desde)} - ${formatFecha(filtros.hasta)}`]], { origin: `A${row}` });
        row++;
      }
      if (filtros.dias_retraso) {
        utils.sheet_add_aoa(ws, [[`Días mínimos de atraso: ${filtros.dias_retraso}`]], { origin: `A${row}` });
        row++;
      }
      if (filtros.monto_min) {
        utils.sheet_add_aoa(ws, [[`Monto mínimo: ${formatCurrency(filtros.monto_min)}`]], { origin: `A${row}` });
        row++;
      }
      
      // 4. Espacio antes de la tabla
      row += 2;
      
      // 5. Encabezados de tabla
      const headers = [
        "Cliente", 
        "Email", 
        "Fecha Vencimiento", 
        "Días de Atraso", 
        "Monto Adeudado"
      ];
      utils.sheet_add_aoa(ws, [headers], { origin: `A${row}` });
      row++;
      
      // 6. Datos de morosos
      const rowData = data.datos.map(moroso => [
        `${moroso.nombre} ${moroso.apellidoPaterno} ${moroso.apellidoMaterno}`,
        moroso.email,
        formatFecha(moroso.fechaVencimiento),
        moroso.diasRetraso,
        moroso.monto
      ]);
      
      utils.sheet_add_aoa(ws, rowData, { origin: `A${row}` });
      row += rowData.length + 2;
      
      // 7. Resumen final
      utils.sheet_add_aoa(ws, [
        ["RESUMEN FINAL", "", "", "", ""],
        ["Total de morosos:", "", "", "", data.datos.length],
        ["Total adeudado:", "", "", "", totalMonto]
      ], { origin: `A${row}` });
      
      // 8. Aplicar formatos
      const range = utils.decode_range(ws['!ref'] || "A1:Z100");
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = {c: C, r: R};
          const cell_ref = utils.encode_cell(cell_address);
          
          if (!ws[cell_ref]) ws[cell_ref] = {t: 's', v: ''};
          
          // Formato de moneda para montos
          if (C === 4 && R >= row - 3) {
            if (!ws[cell_ref].z) ws[cell_ref].z = '"$"#,##0.00_);[Red]("$"#,##0.00)';
          }
        }
      }
      
      // 9. Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 30 }, // Cliente
        { wch: 30 }, // Email
        { wch: 15 }, // Fecha Vencimiento
        { wch: 15 }, // Días de Atraso
        { wch: 15 }  // Monto Adeudado
      ];
      
      // 10. Combinar celdas para títulos
      ws['!merges'] = [
        // Combinar empresa (A1:E1)
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        // Combinar título (A2:E2)
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        // Combinar RESUMEN FINAL (A[row]:E[row])
        { s: { r: row - 1, c: 0 }, e: { r: row - 1, c: 4 } }
      ];
      
      // 11. Añadir hoja al libro y descargar
      utils.book_append_sheet(wb, ws, 'Reporte de Morosos');
      const fileName = `reporte-morosos-${filtros.desde || 'todos'}-${filtros.hasta || 'todos'}.xlsx`;
      writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error en generarReporteExcel:', error);
      throw error;
    }
  };

  // Generar reporte
  const handleGenerarReporte = async () => {
    // Paso 1: Solicitar filtros
    const { value: formValues } = await Swal.fire({
      title: 'Generar Reporte de Morosos',
      html: `
        <div style="text-align: left;">
          <label for="swal-desde" style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha vencimiento desde (opcional):</label>
          <input id="swal-desde" type="date" class="swal2-input" style="margin-bottom: 10px;">
          
          <label for="swal-hasta" style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha vencimiento hasta (opcional):</label>
          <input id="swal-hasta" type="date" class="swal2-input" style="margin-bottom: 10px;">
          
          <label for="swal-dias" style="display: block; margin-bottom: 5px; font-weight: bold;">Días mínimos de atraso:</label>
          <select id="swal-dias" class="swal2-input" style="margin-bottom: 10px;">
            <option value="">Todos</option>
            <option value="30">Mínimo 30 días</option>
            <option value="60">Mínimo 60 días</option>
            <option value="90">Mínimo 90 días</option>
          </select>
          
          <label for="swal-monto" style="display: block; margin-bottom: 5px; font-weight: bold;">Monto mínimo adeudado:</label>
          <input id="swal-monto" type="number" class="swal2-input" placeholder="Ej: 5000" min="0">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      width: '500px',
      preConfirm: () => {
        const desde = (document.getElementById('swal-desde') as HTMLInputElement).value;
        const hasta = (document.getElementById('swal-hasta') as HTMLInputElement).value;
        const dias = (document.getElementById('swal-dias') as HTMLSelectElement).value;
        const monto = (document.getElementById('swal-monto') as HTMLInputElement).value;
        
        if (desde && hasta && new Date(desde) > new Date(hasta)) {
          Swal.showValidationMessage('La fecha desde no puede ser mayor que la fecha hasta');
          return false;
        }
        
        return { 
          desde: desde || undefined, 
          hasta: hasta || undefined,
          dias_retraso: dias ? Number(dias) : undefined,
          monto_min: monto ? Number(monto) : undefined
        };
      }
    });

    if (!formValues) return;

    // Paso 2: Solicitar formato
    const formatoResult = await Swal.fire({
      title: 'Seleccionar Formato',
      text: '¿En qué formato desea generar el reporte?',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'PDF',
      denyButtonText: 'Excel',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74c3c',
      denyButtonColor: '#27ae60'
    });

    if (formatoResult.isDismissed) return;

    const formatoPDF = formatoResult.isConfirmed;

    try {
      setGeneratingReport(true);
      
      console.log('Generando reporte de morosos con filtros:', formValues);
      
      // Obtener datos del reporte
      const response = await generarReporteMorosos({
        desde: formValues.desde,
        hasta: formValues.hasta,
        dias_retraso: formValues.dias_retraso,
        monto_min: formValues.monto_min
      });

      console.log('Datos de morosos recibidos:', response.data);

      if (response.data.datos.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Sin resultados',
          text: 'No se encontraron clientes morosos con los filtros seleccionados',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Generar reporte según formato seleccionado
      try {
        if (formatoPDF) {
          console.log('Generando PDF de morosos...');
          generarReportePDF(response.data, formValues);
        } else {
          console.log('Generando Excel de morosos...');
          generarReporteExcel(response.data, formValues);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Reporte generado',
          text: `Se generó el reporte ${formatoPDF ? 'PDF' : 'Excel'} con ${response.data.datos.length} clientes morosos. El archivo se ha descargado automáticamente.`,
          confirmButtonColor: '#3085d6'
        });

      } catch (generationError) {
        console.error('Error generando archivo:', generationError);
        throw new Error('Error al generar el archivo');
      }

    } catch (error) {
      console.error('Error completo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo generar el reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('Filtro cambiado:', name, value);
    
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Resetear a página 1 cuando cambian los filtros
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (pagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (pagination.page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pagination.totalPages);
      } else if (pagination.page >= pagination.totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = pagination.totalPages - 3; i <= pagination.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = pagination.page - 1; i <= pagination.page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pagination.totalPages);
      }
    }
    
    return pages;
  };

  const handleNotificar = async (id: string, nombre: string) => {
    try {
      const result = await Swal.fire({
        title: `¿Enviar notificación a ${nombre}?`,
        text: 'Se enviará un recordatorio por correo electrónico',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await enviarNotificacionMoroso(id);
        Swal.fire('¡Enviado!', 'La notificación fue enviada con éxito', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo enviar la notificación', 'error');
      console.error(error);
    }
  };

  // Ver detalles del moroso (CON deudas detalladas)
  const verDetalles = (moroso: ClienteMoroso) => {
    const htmlContent = `
      <div style="text-align: left;">
        <h5 style="margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          Información del Cliente
        </h5>
        <p><strong>Nombre:</strong> ${moroso.cliente.nombreCompleto}</p>
        <p><strong>Email:</strong> ${moroso.cliente.email}</p>
        <p><strong>Teléfono:</strong> ${moroso.cliente.telefono || 'N/A'}</p>
        <p><strong>Total Adeudado:</strong> ${formatCurrency(moroso.montoTotal)}</p>
        <p><strong>Cantidad de Deudas:</strong> ${moroso.cantidadDeudas}</p>
        <p><strong>Días Máximos de Atraso:</strong> ${moroso.diasRetrasoMaximo} días</p>
        
        <hr style="margin: 20px 0; border-top: 1px solid #eee;">
        
        <h5 style="margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          Detalle de Deudas
        </h5>
        
        <div style="max-height: 300px; overflow-y: auto;">
          ${moroso.deudas.map(deuda => `
            <div style="background: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
              <p><strong>Descripción:</strong> ${deuda.descripcion}</p>
              <p><strong>Monto:</strong> ${formatCurrency(deuda.monto)}</p>
              <p><strong>Fecha Vencimiento:</strong> ${formatFecha(deuda.fechaVencimiento)}</p>
              <p><strong>Días de Atraso:</strong> ${deuda.diasRetraso} días</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Detalles del Cliente Moroso',
      html: htmlContent,
      width: '700px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6',
      customClass: {
        popup: 'moroso-details-popup',
        container: 'moroso-details-container'
      }
    });
  };

  if (error) {
    return (
      <div className="alert alert-danger mt-4">
        {error} - <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="tenant-mor">
      <header className="tenant-mor__header">
        <h1 className="tenant-mor__title">Clientes Morosos</h1>
        <p className="tenant-mor__subtitle">
          {pagination.total} cliente{pagination.total !== 1 ? 's' : ''} con pagos vencidos
          {(filtros.dias_retraso || filtros.rango_monto !== '0' || filtros.orden !== 'mayor_deuda') && (
            <span className="ms-2 badge bg-primary">
              Filtros aplicados
            </span>
          )}
        </p>
      </header>

      <div className="tenant-mor__filters-section">
        <div className="tenant-mor__filters-header">
          <div>
            <h5 className="tenant-mor__filters-title">Filtros de búsqueda</h5>
            {(filtros.dias_retraso || filtros.rango_monto !== '0' || filtros.orden !== 'mayor_deuda') && (
              <small className="text-muted">
                <i className="fas fa-filter me-1"></i>
                Filtros activos
              </small>
            )}
          </div>
          <button
            className="tenant-mor__btn-report btn-report rounded"
            onClick={handleGenerarReporte}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generando...
              </>
            ) : (
              <>
                <i className="fas fa-download me-2"></i>Generar Reporte
              </>
            )}
          </button>
        </div>
        <div className="tenant-mor__filters-row">
          <div className="tenant-mor__filter-group">
            <label>Días de atraso mínimos</label>
            <select 
              name="dias_retraso"
              className="form-select"
              value={filtros.dias_retraso}
              onChange={handleFiltroChange}
            >
              <option value="">Todos</option>
              <option value="1">Mínimo 1 día</option>
              <option value="30">Mínimo 30 días</option>
              <option value="60">Mínimo 60 días</option>
              <option value="90">Mínimo 90 días</option>
            </select>
          </div>
          <div className="tenant-mor__filter-group">
            <label>Rango de deuda</label>
            <select 
              name="rango_monto"
              className="form-select"
              value={filtros.rango_monto}
              onChange={handleFiltroChange}
            >
              <option value="0">Todos los montos</option>
              <option value="1">$0 - $5,000</option>
              <option value="2">$5,001 - $15,000</option>
              <option value="3">$15,001 - $30,000</option>
              <option value="4">Más de $30,000</option>
            </select>
          </div>
          <div className="tenant-mor__filter-group">
            <label>Ordenar por</label>
            <select 
              name="orden"
              className="form-select"
              value={filtros.orden}
              onChange={handleFiltroChange}
            >
              <option value="mayor_deuda">Mayor deuda</option>
              <option value="menor_deuda">Menor deuda</option>
              <option value="mas_dias">Más días de atraso</option>
              <option value="menos_dias">Menos días de atraso</option>
            </select>
          </div>
          <div className="tenant-mor__filter-group">
            <label>Acciones</label>
            <button
              className="form-control btn btn-secondary"
              onClick={() => {
                setFiltros({ dias_retraso: '', rango_monto: '0', orden: 'mayor_deuda' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <i className="fas fa-times me-2"></i>Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Vista Desktop */}
      <div className="tenant-mor__table-section d-none d-md-block">
        <div className="table-responsive">
          <table className="tenant-mor__table table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Monto Adeudado</th>
                <th>Días de Atraso</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {morosos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No se encontraron clientes morosos
                  </td>
                </tr>
              ) : (
                morosos.map((moroso) => (
                  <tr key={moroso.cliente.id_cliente}>
                    <td className="tenant-mor__client-name">
                      {moroso.cliente.nombreCompleto}
                    </td>
                    <td>{moroso.cliente.email}</td>
                    <td>{moroso.cliente.telefono || 'N/A'}</td>
                    <td className="tenant-mor__debt-amount">
                      {formatCurrency(moroso.montoTotal)}
                    </td>
                    <td>
                      <span className="tenant-mor__days-overdue">
                        {moroso.diasRetrasoMaximo} días
                      </span>
                    </td>
                    <td>
                      <div className="tenant-mor__action-buttons">
                        <button
                          className="tenant-mor__btn-action tenant-mor__btn-action--notify"
                          onClick={() => handleNotificar(
                            moroso.cliente.id_cliente, 
                            moroso.cliente.nombreCompleto
                          )}
                        >
                          <i className="fas fa-bell me-1"></i> Notificar
                        </button>
                        <button
                          className="tenant-mor__btn-action tenant-mor__btn-action--detail"
                          onClick={() => verDetalles(moroso)}
                        >
                          <i className="fas fa-eye me-1"></i> Detalles
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación - Solo mostrar si hay datos */}
        {pagination.total > 0 && (
          <footer className="tenant-mor__table-footer">
            <span className="tenant-mor__entries">
              Mostrando {morosos.length} de {pagination.total} clientes
            </span>
            
            {pagination.totalPages > 1 && (
              <ul className="tenant-mor__pagination pagination mb-0">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    &laquo;
                  </button>
                </li>
                
                {generatePageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <li key={`dots-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  
                  return (
                    <li 
                      key={page} 
                      className={`page-item ${pagination.page === page ? 'active' : ''}`}
                    >
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(page as number)}
                      >
                        {page}
                      </button>
                    </li>
                  );
                })}
                
                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            )}
          </footer>
        )}
      </div>

      {/* Vista Móvil */}
      <div className="d-md-none">
        {morosos.length === 0 ? (
          <div className="alert alert-info my-4">
            No se encontraron clientes morosos
          </div>
        ) : (
          <>
            <div className="tenant-mor__mobile-list">
              {morosos.map((moroso) => (
                <div key={moroso.cliente.id_cliente} className="tenant-mor__mobile-card">
                  <div className="tenant-mor__mobile-header">
                    <h5>{moroso.cliente.nombreCompleto}</h5>
                    <span className="tenant-mor__days-overdue">
                      {moroso.diasRetrasoMaximo} días
                    </span>
                  </div>
                  
                  <div className="tenant-mor__mobile-details">
                    <div>
                      <i className="fas fa-envelope me-2"></i>
                      {moroso.cliente.email || 'N/A'}
                    </div>
                    <div>
                      <i className="fas fa-phone me-2"></i>
                      {moroso.cliente.telefono || 'N/A'}
                    </div>
                    <div>
                      <i className="fas fa-money-bill-wave me-2"></i>
                      {formatCurrency(moroso.montoTotal)}
                    </div>
                  </div>
                  
                  <div className="tenant-mor__mobile-actions">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleNotificar(
                        moroso.cliente.id_cliente, 
                        moroso.cliente.nombreCompleto
                      )}
                    >
                      <i className="fas fa-bell me-1"></i> Notificar
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => verDetalles(moroso)}
                    >
                      <i className="fas fa-eye me-1"></i> Detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginación móvil - Solo mostrar si hay datos */}
            {pagination.total > 0 && pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <ul className="pagination">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      &laquo;
                    </button>
                  </li>
                  
                  {generatePageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <li key={`dots-${index}`} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    
                    return (
                      <li 
                        key={page} 
                        className={`page-item ${pagination.page === page ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(page as number)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MorososTenant;