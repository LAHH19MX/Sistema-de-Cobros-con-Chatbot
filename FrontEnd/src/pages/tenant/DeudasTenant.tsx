import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CellDef, RowInput } from 'jspdf-autotable'
import { utils, writeFile } from 'xlsx';
import { getDeudas, getWidgetsDeudas, generarReporteDeudas } from '../../api/deudasTenant';
import { getSocket } from '../../config/socket';
import type { Deuda, WidgetsDeudas, ReporteDeudas } from '../../api/deudasTenant';
import '../../styles/tenant/DeudasTenant.css';

// Extender jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const DeudasTenant: React.FC = () => {
  const navigate = useNavigate();
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [widgets, setWidgets] = useState<WidgetsDeudas>({
    pendientes: 0,
    pagadas: 0,
    vencidas: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeudas, setTotalDeudas] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const limit = 8;

  // Cargar datos
  const cargarDatos = async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Cargar widgets y deudas en paralelo
      const [widgetsRes, deudasRes] = await Promise.all([
        getWidgetsDeudas(),
        getDeudas({ page, limit })
      ]);
      
      setWidgets(widgetsRes.data);
      setDeudas(deudasRes.data.data);
      setCurrentPage(deudasRes.data.pagination.page);
      setTotalPages(deudasRes.data.pagination.totalPages);
      setTotalDeudas(deudasRes.data.pagination.total);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire('Error', 'No se pudieron cargar las deudas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Socket.io listeners
  useEffect(() => {
    cargarDatos();

    const socket = getSocket();
    if (socket) {
      socket.on('deuda:created', () => {
        cargarDatos(currentPage);
      });

      socket.on('deuda:updated', () => {
        cargarDatos(currentPage);
      });

      socket.on('deuda:paid', () => {
        cargarDatos(currentPage);
      });
    }

    return () => {
      if (socket) {
        socket.off('deuda:created');
        socket.off('deuda:updated');
        socket.off('deuda:paid');
      }
    };
  }, []);

  // Buscar deudas (filtrar localmente por ahora)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filtrar deudas según búsqueda
  const deudasFiltradas = deudas.filter(deuda => {
    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = `${deuda.Cliente?.nombre_cliente} ${deuda.Cliente?.apellido_paterno} ${deuda.Cliente?.apellido_materno || ''}`.toLowerCase();
    const concepto = deuda.descripcion.toLowerCase();
    
    return nombreCompleto.includes(searchLower) || concepto.includes(searchLower);
  });

  // Cambiar página
  const handlePageChange = (page: number) => {
    cargarDatos(page);
  };

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX');
  };

  // Formatear moneda
  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  // Obtener clase CSS según estado
  const getEstadoClass = (estado: string) => {
    switch(estado) {
      case 'pendiente': return 'tenant-deudas-status--pending';
      case 'pagado': return 'tenant-deudas-status--paid';
      case 'vencido': return 'tenant-deudas-status--overdue';
      default: return '';
    }
  };

  // Obtener texto del estado
  const getEstadoText = (estado: string) => {
    switch(estado) {
      case 'pendiente': return 'Pendiente';
      case 'pagado': return 'Pagada';
      case 'vencido': return 'Vencida';
      default: return estado;
    }
  };

  // Ver detalles de deuda
  const handleVerDetalles = (deuda: Deuda) => {
    const montoOriginal = Number(deuda.monto_original);
    const saldoPendiente = Number(deuda.saldo_pendiente);
    const montoPagado = montoOriginal - saldoPendiente;
    
    Swal.fire({
      title: 'Detalles de la Deuda',
      html: `
        <div style="text-align: left;">
          <h5 style="margin-bottom: 15px;">Información del Cliente</h5>
          <p><strong>Nombre:</strong> ${deuda.Cliente?.nombre_cliente} ${deuda.Cliente?.apellido_paterno} ${deuda.Cliente?.apellido_materno || ''}</p>
          <p><strong>Email:</strong> ${deuda.Cliente?.email_cliente}</p>
          <p><strong>Teléfono:</strong> ${deuda.Cliente?.telefono_cliente}</p>
          
          <hr style="margin: 20px 0;">
          
          <h5 style="margin-bottom: 15px;">Información de la Deuda</h5>
          <p><strong>ID:</strong> #${deuda.id_deuda.substring(0, 8).toUpperCase()}</p>
          <p><strong>Concepto:</strong> ${deuda.descripcion}</p>
          <p><strong>Fecha de Emisión:</strong> ${formatFecha(deuda.fecha_emision)}</p>
          <p><strong>Fecha de Vencimiento:</strong> ${formatFecha(deuda.fecha_vencimiento)}</p>
          <p><strong>Estado:</strong> <span class="tenant-deudas-status ${getEstadoClass(deuda.estado_deuda)}">${getEstadoText(deuda.estado_deuda)}</span></p>
          
          <hr style="margin: 20px 0;">
          
          <h5 style="margin-bottom: 15px;">Información de Pago</h5>
          <p><strong>Monto Original:</strong> ${formatMoneda(montoOriginal)}</p>
          <p><strong>Monto Pagado:</strong> ${formatMoneda(montoPagado)}</p>
          <p><strong>Saldo Pendiente:</strong> ${formatMoneda(saldoPendiente)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6',
      width: '600px'
    });
  };

  // Generar reporte PDF
  const generarReportePDF = (data: ReporteDeudas, filtros: any) => {
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
      
      // Primera línea: Reporte de deudas y Formato PDF
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Izquierda: "Reporte de deudas"
      doc.text('Reporte de deudas', margin, currentY);
      
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
      
      // Tabla con bordes negros
      const headers: CellDef[] = [
        { content: 'Cliente', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } },
        { content: 'Email', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } },
        { content: 'Fecha Emisión', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } },
        { content: 'Fecha Vencimiento', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } },
        { content: 'Monto Original', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } },
        { content: 'Pagado', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } },
        { content: 'Estado', styles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 } }
      ];
      
      const body: RowInput[] = data.datos.map(deuda => [
        `${deuda.nombre} ${deuda.apellidoPaterno} ${deuda.apellidoMaterno}`,
        deuda.email,
        formatFecha(deuda.fechaEmision),
        formatFecha(deuda.fechaVencimiento),
        formatMoneda(deuda.monto),
        formatMoneda(deuda.pagado),
        getEstadoText(deuda.estado)
      ]);
      
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: currentY,
        theme: 'grid', // Bordes completos
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [0, 0, 0], // Bordes negros
          lineWidth: 0.2,
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [41, 128, 185],
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
      const totalMonto = data.datos.reduce((sum, deuda) => sum + deuda.monto, 0);
      const totalPagado = data.datos.reduce((sum, deuda) => sum + deuda.pagado, 0);
      const totalPendiente = totalMonto - totalPagado;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN FINAL', margin, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de deudas: ${data.datos.length}`, margin, finalY + 8);
      doc.text(`Monto total: ${formatMoneda(totalMonto)}`, margin, finalY + 16);
      doc.text(`Total pagado: ${formatMoneda(totalPagado)}`, margin, finalY + 24);
      doc.text(`Total pendiente: ${formatMoneda(totalPendiente)}`, margin, finalY + 32);
      
      // Descargar PDF
      const fileName = `reporte-deudas-${filtros.desde}-${filtros.hasta}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error en generarReportePDF:', error);
      throw error;
    }
  };

    const generarReporteExcel = (data: ReporteDeudas, filtros: any) => {
    try {
      // Calcular totales
      const totalMonto = data.datos.reduce((sum, deuda) => sum + deuda.monto, 0);
      const totalPagado = data.datos.reduce((sum, deuda) => sum + deuda.pagado, 0);
      const totalPendiente = totalMonto - totalPagado;
      
      // Crear libro de trabajo
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet([]);
      
      // 1. Encabezado principal
      utils.sheet_add_aoa(ws, [[data.empresa?.nombre || "Mi Empresa"]], { origin: "A1" });
      utils.sheet_add_aoa(ws, [["Reporte de Deudas"]], { origin: "A2" });
      
      // 2. Información de generación
      utils.sheet_add_aoa(ws, [
        ["Generado por:", `${data.inquilino.nombre} ${data.inquilino.apellidoPaterno} ${data.inquilino.apellidoMaterno}`],
        ["Generado el:", formatFecha(data.fechaGeneracion)],
        ["Período:", `${formatFecha(filtros.desde)} - ${formatFecha(filtros.hasta)}`],
        ["Formato:", "Excel"]
      ], { origin: "A4" });
      
      // 3. Espacio antes de la tabla
      utils.sheet_add_aoa(ws, [[]], { origin: "A8" });
      
      // 4. Encabezados de tabla
      const headers = [
        "Cliente", 
        "Email", 
        "Fecha Emisión", 
        "Fecha Vencimiento", 
        "Monto Original", 
        "Monto Pagado", 
        "Saldo Pendiente", 
        "Estado"
      ];
      utils.sheet_add_aoa(ws, [headers], { origin: "A9" });
      
      // 5. Datos de deudas
      const rowData = data.datos.map(deuda => [
        `${deuda.nombre} ${deuda.apellidoPaterno} ${deuda.apellidoMaterno}`,
        deuda.email,
        formatFecha(deuda.fechaEmision),
        formatFecha(deuda.fechaVencimiento),
        deuda.monto,
        deuda.pagado,
        deuda.monto - deuda.pagado,
        getEstadoText(deuda.estado)
      ]);
      
      utils.sheet_add_aoa(ws, rowData, { origin: "A10" });
      
      // 6. Resumen final
      const startSummaryRow = 10 + rowData.length + 2;
      utils.sheet_add_aoa(ws, [
        ["RESUMEN FINAL", "", "", "", "", "", "", ""],
        ["Total de deudas:", "", "", "", "", "", data.datos.length],
        ["Monto total:", "", "", "", "", "", totalMonto],
        ["Total pagado:", "", "", "", "", "", totalPagado],
        ["Total pendiente:", "", "", "", "", "", totalPendiente]
      ], { origin: `A${startSummaryRow}` });
      
      // 7. Aplicar estilos (solo formato de moneda, estilos completos requieren Pro)
      // Formato de moneda para columnas numéricas
      const range = utils.decode_range(ws['!ref'] || "A1:Z100");
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = {c: C, r: R};
          const cell_ref = utils.encode_cell(cell_address);
          
          if (!ws[cell_ref]) ws[cell_ref] = {t: 's', v: ''};
          
          // Formato de moneda para columnas numéricas
          if ([4, 5, 6].includes(C) && R >= 10) {
            if (!ws[cell_ref].z) ws[cell_ref].z = '"$"#,##0.00_);[Red]("$"#,##0.00)';
          }
        }
      }
      
      // 8. Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 30 }, // Cliente
        { wch: 35 }, // Email
        { wch: 15 }, // Fecha Emisión
        { wch: 15 }, // Fecha Vencimiento
        { wch: 15 }, // Monto Original
        { wch: 15 }, // Monto Pagado
        { wch: 15 }, // Saldo Pendiente
        { wch: 12 }  // Estado
      ];
      
      // 9. Combinar celdas para títulos
      ws['!merges'] = [
        // Combinar empresa (A1:H1)
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        // Combinar título (A2:H2)
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        // Combinar RESUMEN FINAL (A[startSummaryRow]:H[startSummaryRow])
        { s: { r: startSummaryRow - 1, c: 0 }, e: { r: startSummaryRow - 1, c: 7 } }
      ];
      
      // 10. Añadir hoja al libro y descargar
      utils.book_append_sheet(wb, ws, 'Reporte de Deudas');
      const fileName = `reporte-deudas-${filtros.desde}-${filtros.hasta}.xlsx`;
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
      title: 'Generar Reporte de Deudas',
      html: `
        <div style="text-align: left;">
          <label for="swal-desde" style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha desde:</label>
          <input id="swal-desde" type="date" class="swal2-input" required style="margin-bottom: 10px;">
          
          <label for="swal-hasta" style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha hasta:</label>
          <input id="swal-hasta" type="date" class="swal2-input" required style="margin-bottom: 10px;">
          
          <label for="swal-estado" style="display: block; margin-bottom: 5px; font-weight: bold;">Estado:</label>
          <select id="swal-estado" class="swal2-input" style="margin-bottom: 10px;">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Solo pendientes</option>
            <option value="pagado">Solo pagadas</option>
          </select>
          
          <label for="swal-cliente" style="display: block; margin-bottom: 5px; font-weight: bold;">Cliente específico (opcional):</label>
          <input id="swal-cliente" type="text" class="swal2-input" placeholder="ID del cliente (opcional)">
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
        const estado = (document.getElementById('swal-estado') as HTMLSelectElement).value;
        const cliente = (document.getElementById('swal-cliente') as HTMLInputElement).value;
        
        if (!desde || !hasta) {
          Swal.showValidationMessage('Por favor complete las fechas');
          return false;
        }
        
        if (new Date(desde) > new Date(hasta)) {
          Swal.showValidationMessage('La fecha desde no puede ser mayor que la fecha hasta');
          return false;
        }
        
        return { desde, hasta, estado, cliente: cliente || undefined };
      }
    });

    if (!formValues) return;

    // Paso 2: Solicitar formato con botones específicos
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

    // Si cancela, salir
    if (formatoResult.isDismissed) return;

    // Determinar formato: true = PDF, false = Excel
    const formatoPDF = formatoResult.isConfirmed;

    try {
      setGeneratingReport(true);
      
      console.log('Generando reporte con filtros:', formValues);
      
      // Obtener datos del reporte
      const response = await generarReporteDeudas({
        desde: formValues.desde,
        hasta: formValues.hasta,
        estado: formValues.estado === 'todos' ? undefined : formValues.estado,
        id_cliente: formValues.cliente
      });

      console.log('Datos recibidos:', response.data);

      if (response.data.datos.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Sin resultados',
          text: 'No se encontraron deudas con los filtros seleccionados',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Generar reporte según formato seleccionado
      try {
        if (formatoPDF) {
          console.log('Generando PDF...');
          generarReportePDF(response.data, formValues);
        } else {
          console.log('Generando Excel...');
          generarReporteExcel(response.data, formValues);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Reporte generado',
          text: `Se generó el reporte ${formatoPDF ? 'PDF' : 'Excel'} con ${response.data.datos.length} deudas. El archivo se ha descargado automáticamente.`,
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

  // Navegación
  const handleNuevaDeuda = () => {
    navigate('/tenant/deudas/nueva');
  };

  const handleEditarDeuda = (id: string) => {
    navigate(`/tenant/deudas/editar/${id}`);
  };

  // Generar array de páginas
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading && deudas.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="tenant-deudas">
      {/* Header de página */}
      <header className="tenant-deudas__header">
        <h1 className="tenant-deudas__title">Gestión de Deudas</h1>
        <p className="tenant-deudas__subtitle">
          Administra los pagos pendientes y deudas de tus clientes
        </p>
      </header>

      {/* Estadísticas */}
      <div className="tenant-deudas__stats container">
        <div className="row tenant_deb--mar">
          <div className="col-md-4">
            <article className="tenant-deudas-card">
              <div className="tenant-deudas-card__main">
                <div className="tenant-deudas-card__icon tenant-deudas-card__icon--pending">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="tenant-deudas-card__info">
                  <h3>{widgets.pendientes}</h3>
                  <p>Pagos Pendientes</p>
                </div>
              </div>
              <div className="tenant-deudas-card__footer">
                <a
                  className="tenant-deudas-card__link"
                  onClick={() => navigate('/tenant/deudas')}
                >
                  <span>Ver pendientes</span>
                  <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </article>
          </div>
          <div className="col-md-4">
            <article className="tenant-deudas-card">
              <div className="tenant-deudas-card__main">
                <div className="tenant-deudas-card__icon tenant-deudas-card__icon--paid">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="tenant-deudas-card__info">
                  <h3>{widgets.pagadas}</h3>
                  <p>Pagos Cobrados</p>
                </div>
              </div>
              <div className="tenant-deudas-card__footer">
                <a
                  className="tenant-deudas-card__link"
                  onClick={() => navigate('/tenant/ingresos')}
                >
                  <span>Ver pagos</span>
                  <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </article>
          </div>
          <div className="col-md-4">
            <article className="tenant-deudas-card">
              <div className="tenant-deudas-card__main">
                <div className="tenant-deudas-card__icon tenant-deudas-card__icon--overdue">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="tenant-deudas-card__info">
                  <h3>{widgets.vencidas}</h3>
                  <p>Pagos Vencidos</p>
                </div>
              </div>
              <div className="tenant-deudas-card__footer">
                <a
                  className="tenant-deudas-card__link"
                  onClick={() => navigate('/tenant/clientes/morosos')}
                >
                  <span>Ver vencidos</span>
                  <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="tenant-deudas__actions">
        <div className="tenant-deudas__actions-left">
          <button
            className="btn btn-primary-custom"
            onClick={handleNuevaDeuda}
          >
            <i className="fas fa-plus-circle me-2"></i>
            Registrar Nueva Deuda
          </button>
          <button
            className="btn btn-report"
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
                <i className="fas fa-download me-2"></i>
                Generar Reporte
              </>
            )}
          </button>
        </div>
        <div className="tenant-deudas__search">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o concepto…"
            value={searchTerm}
            onChange={handleSearch}
          />
          <i className="fas fa-search"></i>
        </div>
      </div>

      {/* Tabla de deudas */}
      <div className="tenant-deudas__table mb-5">
        <div className="table-responsive">
          <table className="tenant-deudas-table table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th className='text-center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deudasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    {searchTerm ? 'No se encontraron deudas' : 'No hay deudas registradas'}
                  </td>
                </tr>
              ) : (
                deudasFiltradas.map((deuda, index) => (
                  <tr key={deuda.id_deuda}>
                    <td data-label="ID">{(currentPage - 1) * limit + index + 1}</td>
                    <td data-label="Nombre">
                      {deuda.Cliente?.nombre_cliente} {deuda.Cliente?.apellido_paterno}
                    </td>
                    <td data-label="Fecha Límite">{formatFecha(deuda.fecha_vencimiento)}</td>
                    <td data-label="Estado">
                      <span className={`tenant-deudas-status ${getEstadoClass(deuda.estado_deuda)}`}>
                        {getEstadoText(deuda.estado_deuda)}
                      </span>
                    </td>
                    <td data-label="Concepto">{deuda.descripcion}</td>
                    <td data-label="Importe">{formatMoneda(Number(deuda.monto_original))}</td>
                    <td data-label="Acciones">
                      <div className="tenant-deudas-actionsbtn">
                        <button 
                          className="tenant-deudas-btn tenant-deudas-btn--view"
                          onClick={() => handleVerDetalles(deuda)}
                        >
                          <i className="fas fa-eye me-1"></i> Detalles
                        </button>
                        <button 
                          className="tenant-deudas-btn tenant-deudas-btn--edit"
                          onClick={() => handleEditarDeuda(deuda.id_deuda)}
                        >
                          <i className="fas fa-edit me-1"></i> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla */}
        <footer className="tenant-deudas__table-footer">
          <span className="tenant-deudas__entries">
            Mostrando {deudasFiltradas.length} de {totalDeudas} deudas registradas
          </span>
          
          {totalPages > 1 && (
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a 
                  className="page-link" 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                >
                  &laquo;
                </a>
              </li>
              
              {generatePageNumbers().map((page, index) => (
                page === '...' ? (
                  <li key={`dots-${index}`} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                ) : (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <a 
                      className="page-link" 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page as number);
                      }}
                    >
                      {page}
                    </a>
                  </li>
                )
              ))}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <a 
                  className="page-link" 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                >
                  &raquo;
                </a>
              </li>
            </ul>
          )}
        </footer>
      </div>
    </section>
  );
};

export default DeudasTenant;