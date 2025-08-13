import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CellDef, RowInput } from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { 
  getPagosCompletados, 
  getIngresosGrafica,
  generarReporteIngresos,
  type PagoCompletado,
  type DatosGrafica,
  type ReporteIngresos
} from '../../api/ingresosTenant';
import '../../styles/tenant/IngresosTenant.css';

// Extender jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const IngresosTenant: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para tabla de pagos
  const [pagos, setPagos] = useState<PagoCompletado[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPagos, setLoadingPagos] = useState(true);
  
  // Estados para gráficas
  const [datosGrafica, setDatosGrafica] = useState<DatosGrafica | null>(null);
  const [periodoGrafica, setPeriodoGrafica] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [loadingGrafica, setLoadingGrafica] = useState(true);
  
  // Estados para filtros
  const [fechaDesde, setFechaDesde] = useState('2025-01-01');
  const [fechaHasta, setFechaHasta] = useState('2025-07-15');
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);
  
  // Estados para reportes
  const [generatingReport, setGeneratingReport] = useState(false);

  const limit = 8;

  // Cargar datos de gráfica
  const cargarDatosGrafica = async (periodo: 'mensual' | 'trimestral' | 'anual') => {
    try {
      setLoadingGrafica(true);
      const response = await getIngresosGrafica({
        periodo,
        año: new Date().getFullYear(),
        mes: new Date().getMonth() + 1
      });
      setDatosGrafica(response.data);
    } catch (error) {
      console.error('Error cargando datos de gráfica:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos de la gráfica', 'error');
    } finally {
      setLoadingGrafica(false);
    }
  };

  // Cargar pagos completados
  const cargarPagos = async (page: number = 1, aplicarFiltros: boolean = false) => {
    try {
      setLoadingPagos(true);
      
      const params: any = {
        page,
        limit
      };
      
      if (aplicarFiltros || filtrosAplicados) {
        params.desde = fechaDesde;
        params.hasta = fechaHasta;
      }
      
      const response = await getPagosCompletados(params);
      
      setPagos(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      Swal.fire('Error', 'No se pudieron cargar los pagos', 'error');
    } finally {
      setLoadingPagos(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarPagos(1, false);
    cargarDatosGrafica('mensual');
  }, []);

  // Cambiar período de gráfica
  const handleCambioPeriodo = (periodo: 'mensual' | 'trimestral' | 'anual') => {
    setPeriodoGrafica(periodo);
    cargarDatosGrafica(periodo);
  };

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    if (new Date(fechaDesde) > new Date(fechaHasta)) {
      Swal.fire('Error', 'La fecha inicial no puede ser mayor que la fecha final', 'error');
      return;
    }
    setFiltrosAplicados(true);
    setCurrentPage(1);
    cargarPagos(1, true);
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltrosAplicados(false);
    setCurrentPage(1);
    cargarPagos(1, false);
  };

  // Cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    cargarPagos(page, filtrosAplicados);
  };

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear moneda
  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  // Generar reporte PDF
const generarReportePDF = (data: ReporteIngresos, filtros: any) => {
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
      
      // Primera línea: Reporte de ingresos y Formato PDF
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Izquierda: "Reporte de ingresos"
      doc.text('Reporte de ingresos', margin, currentY);
      
      // Derecha: "Formato PDF"
      const formatoText = 'Formato PDF';
      const formatoWidth = doc.getTextWidth(formatoText);
      doc.text(formatoText, pageWidth - margin - formatoWidth, currentY);
      currentY += 8;
      
      // Segunda línea: Por: [nombre] y Generado el: [fecha]
      const generadoPor = `Por: ${data.inquilino}`;
      const fechaGeneracion = `Generado el: ${formatFecha(data.fechaGeneracion)}`;
      doc.text(generadoPor, margin, currentY);
      
      const fechaWidth = doc.getTextWidth(fechaGeneracion);
      doc.text(fechaGeneracion, pageWidth - margin - fechaWidth, currentY);
      currentY += 15;
      
      // Información del período
      doc.text(`Período: ${formatFecha(filtros.desde)} - ${formatFecha(filtros.hasta)}`, margin, currentY);
      currentY += 8;
      
      // Resumen
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN', margin, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de pagos: ${data.resumen.totalPagos}`, margin, currentY);
      currentY += 5;
      doc.text(`Total ingresos: ${formatMoneda(data.resumen.totalIngresos)}`, margin, currentY);
      currentY += 10;
      
      // Tabla con bordes negros
      const headers: CellDef[] = [
        { content: 'Cliente', styles: { fontStyle: 'bold', fillColor: [34, 139, 34], textColor: 255 } },
        { content: 'Email', styles: { fontStyle: 'bold', fillColor: [34, 139, 34], textColor: 255 } },
        { content: 'Método', styles: { fontStyle: 'bold', fillColor: [34, 139, 34], textColor: 255 } },
        { content: 'Descripción', styles: { fontStyle: 'bold', fillColor: [34, 139, 34], textColor: 255 } },
        { content: 'Fecha Pago', styles: { fontStyle: 'bold', fillColor: [34, 139, 34], textColor: 255 } },
        { content: 'Monto Neto', styles: { fontStyle: 'bold', fillColor: [34, 139, 34], textColor: 255 } }
      ];
      
      const body: RowInput[] = data.datos.map(pago => [
        pago.nombreCompleto,
        pago.email,
        pago.metodo,
        pago.descripcion,
        formatFecha(pago.fechaPago),
        formatMoneda(pago.montoNeto)
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
          fillColor: [34, 139, 34],
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
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN FINAL', margin, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de pagos: ${data.resumen.totalPagos}`, margin, finalY + 8);
      doc.text(`Total ingresos: ${formatMoneda(data.resumen.totalIngresos)}`, margin, finalY + 16);
      
      // Descargar PDF
      const fileName = `reporte-ingresos-${filtros.desde}-${filtros.hasta}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error en generarReportePDF:', error);
      throw error;
    }
  };

  // Generar reporte Excel
  const generarReporteExcel = (data: ReporteIngresos, filtros: any) => {
    try {
      // Calcular totales
      const totalPagos = data.resumen.totalPagos;
      const totalIngresos = data.resumen.totalIngresos;
      
      // Crear libro de trabajo
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet([]);
      
      // 1. Encabezado principal
      utils.sheet_add_aoa(ws, [[data.empresa?.nombre || "Mi Empresa"]], { origin: "A1" });
      utils.sheet_add_aoa(ws, [["Reporte de Ingresos"]], { origin: "A2" });
      
      // 2. Información de generación
      utils.sheet_add_aoa(ws, [
        ["Generado por:", data.inquilino],
        ["Generado el:", formatFecha(data.fechaGeneracion)],
        ["Formato:", "Excel"]
      ], { origin: "A4" });
      
      // 3. Período
      utils.sheet_add_aoa(ws, [
        ["Período:", `${formatFecha(filtros.desde)} - ${formatFecha(filtros.hasta)}`]
      ], { origin: "A7" });
      
      // 4. Espacio antes de la tabla
      utils.sheet_add_aoa(ws, [[]], { origin: "A9" });
      
      // 5. Encabezados de tabla
      const headers = [
        "Cliente", 
        "Email", 
        "Método", 
        "Descripción", 
        "Fecha Pago", 
        "Monto Neto"
      ];
      utils.sheet_add_aoa(ws, [headers], { origin: "A10" });
      
      // 6. Datos de pagos
      const rowData = data.datos.map(pago => [
        pago.nombreCompleto,
        pago.email,
        pago.metodo,
        pago.descripcion,
        formatFecha(pago.fechaPago),
        pago.montoNeto
      ]);
      
      utils.sheet_add_aoa(ws, rowData, { origin: "A11" });
      
      // 7. Resumen final
      const startSummaryRow = 11 + rowData.length + 2;
      utils.sheet_add_aoa(ws, [
        ["RESUMEN FINAL", "", "", "", "", ""],
        ["Total de pagos:", "", "", "", "", totalPagos],
        ["Total ingresos:", "", "", "", "", totalIngresos]
      ], { origin: `A${startSummaryRow}` });
      
      // 8. Aplicar formatos
      const range = utils.decode_range(ws['!ref'] || "A1:Z100");
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = {c: C, r: R};
          const cell_ref = utils.encode_cell(cell_address);
          
          if (!ws[cell_ref]) ws[cell_ref] = {t: 's', v: ''};
          
          // Formato de moneda para montos
          if (C === 5 && R >= 11) {
            if (!ws[cell_ref].z) ws[cell_ref].z = '"$"#,##0.00_);[Red]("$"#,##0.00)';
          }
        }
      }
      
      // 9. Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 25 }, // Cliente
        { wch: 30 }, // Email
        { wch: 15 }, // Método
        { wch: 30 }, // Descripción
        { wch: 15 }, // Fecha Pago
        { wch: 15 }  // Monto Neto
      ];
      
      // 10. Combinar celdas para títulos
      ws['!merges'] = [
        // Combinar empresa (A1:F1)
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        // Combinar título (A2:F2)
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        // Combinar RESUMEN FINAL (A[startSummaryRow]:F[startSummaryRow])
        { s: { r: startSummaryRow - 1, c: 0 }, e: { r: startSummaryRow - 1, c: 5 } }
      ];
      
      // 11. Añadir hoja al libro y descargar
      utils.book_append_sheet(wb, ws, 'Reporte de Ingresos');
      const fileName = `reporte-ingresos-${filtros.desde}-${filtros.hasta}.xlsx`;
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
      title: 'Generar Reporte de Ingresos',
      html: `
        <div style="text-align: left;">
          <label for="swal-desde" style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha desde:</label>
          <input id="swal-desde" type="date" class="swal2-input" value="${fechaDesde}" required style="margin-bottom: 10px;">
          
          <label for="swal-hasta" style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha hasta:</label>
          <input id="swal-hasta" type="date" class="swal2-input" value="${fechaHasta}" required style="margin-bottom: 10px;">
          
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
        const cliente = (document.getElementById('swal-cliente') as HTMLInputElement).value;
        
        if (!desde || !hasta) {
          Swal.showValidationMessage('Por favor complete las fechas');
          return false;
        }
        
        if (new Date(desde) > new Date(hasta)) {
          Swal.showValidationMessage('La fecha desde no puede ser mayor que la fecha hasta');
          return false;
        }
        
        return { desde, hasta, cliente: cliente || undefined };
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
      
      console.log('Generando reporte de ingresos con filtros:', formValues);
      
      // Obtener datos del reporte
      const response = await generarReporteIngresos({
        desde: formValues.desde,
        hasta: formValues.hasta,
        id_cliente: formValues.cliente
      });

      console.log('Datos de ingresos recibidos:', response.data);

      if (response.data.datos.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Sin resultados',
          text: 'No se encontraron ingresos con los filtros seleccionados',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Generar reporte según formato seleccionado
      try {
        if (formatoPDF) {
          console.log('Generando PDF de ingresos...');
          generarReportePDF(response.data, formValues);
        } else {
          console.log('Generando Excel de ingresos...');
          generarReporteExcel(response.data, formValues);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Reporte generado',
          text: `Se generó el reporte ${formatoPDF ? 'PDF' : 'Excel'} con ${response.data.datos.length} ingresos. El archivo se ha descargado automáticamente.`,
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

  // Ver detalles del pago
  const handleVerDetalles = (pago: PagoCompletado) => {
    Swal.fire({
      title: 'Detalles del Pago',
      html: `
        <div style="text-align: left;">
          <h5 style="margin-bottom: 15px;">Información del Cliente</h5>
          <p><strong>Nombre:</strong> ${pago.cliente.nombreCompleto}</p>
          <p><strong>Email:</strong> ${pago.cliente.email}</p>
          
          <hr style="margin: 20px 0;">
          
          <h5 style="margin-bottom: 15px;">Información de la Deuda</h5>
          <p><strong>Descripción:</strong> ${pago.deuda.descripcion}</p>
          <p><strong>Monto Original:</strong> ${formatMoneda(pago.deuda.montoOriginal)}</p>
          
          <hr style="margin: 20px 0;">
          
          <h5 style="margin-bottom: 15px;">Información del Pago</h5>
          <p><strong>Fecha de Pago:</strong> ${formatFecha(pago.pago.fechaPago)}</p>
          <p><strong>Monto Pagado:</strong> ${formatMoneda(pago.deuda.montoOriginal)}</p>
          <p><strong>Monto Neto:</strong> ${formatMoneda(pago.pago.importe)}</p>
          <p><strong>Referencia:</strong> ${pago.pago.referencia || 'N/A'}</p>
          <p><strong>Concepto:</strong> ${pago.pago.concepto || 'N/A'}</p>
          ${pago.pago.observaciones ? `<p><strong>Observaciones:</strong> ${pago.pago.observaciones}</p>` : ''}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6',
      width: '600px'
    });
  };

  return (
    <section className="tenant-inc">
      {/* Header de página */}
      <header className="tenant-inc__header">
        <h1 className="tenant-inc__title">Reporte de Ingresos</h1>
        <p className="tenant-inc__subtitle">
          Monitorea y analiza los ingresos de tu negocio
        </p>
      </header>

      <div className="tenant-inc__main-section">
        {/* Gráfico de ingresos - DINÁMICO */}
        <div className="tenant-inc__chart-container">
          <div className="tenant-inc__chart-header">
            <h3>
              <i className="fas fa-chart-bar me-2"></i> Evolución de Ingresos
            </h3>
            <div className="tenant-inc__chart-period-selector">
              <button 
                className={`tenant-inc__period-btn ${periodoGrafica === 'mensual' ? 'active' : ''}`}
                onClick={() => handleCambioPeriodo('mensual')}
                disabled={loadingGrafica}
              >
                Mensual
              </button>
              <button 
                className={`tenant-inc__period-btn ${periodoGrafica === 'trimestral' ? 'active' : ''}`}
                onClick={() => handleCambioPeriodo('trimestral')}
                disabled={loadingGrafica}
              >
                Trimestral
              </button>
              <button 
                className={`tenant-inc__period-btn ${periodoGrafica === 'anual' ? 'active' : ''}`}
                onClick={() => handleCambioPeriodo('anual')}
                disabled={loadingGrafica}
              >
                Anual
              </button>
            </div>
          </div>
          
          <div className="tenant-inc__chart-content">
            {loadingGrafica ? (
              <div className="tenant-inc__chart-loading">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando gráfica...</span>
                </div>
                <p>Cargando datos de la gráfica...</p>
              </div>
            ) : datosGrafica && datosGrafica.datos.length > 0 ? (
              <>
                {/* Resumen de totales */}
                <div className="tenant-inc__chart-summary">
                  <div className="tenant-inc__summary-item">
                    <span className="tenant-inc__summary-label">Total Ingresos:</span>
                    <span className="tenant-inc__summary-value">{formatMoneda(datosGrafica.totales.ingresoTotal)}</span>
                  </div>
                  <div className="tenant-inc__summary-item">
                    <span className="tenant-inc__summary-label">Total Pagos:</span>
                    <span className="tenant-inc__summary-value">{datosGrafica.totales.cantidadPagos}</span>
                  </div>
                  <div className="tenant-inc__summary-item">
                    <span className="tenant-inc__summary-label">Promedio Mensual:</span>
                    <span className="tenant-inc__summary-value">{formatMoneda(datosGrafica.totales.promedioMensual)}</span>
                  </div>
                </div>

                {/* Gráfica */}
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={datosGrafica.datos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="periodo" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatMoneda(value)}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatMoneda(Number(value)), 
                        name === 'total' ? 'Total Ingresos' : name
                      ]}
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      fill="#22c55e" 
                      name="Ingresos"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="tenant-inc__chart-placeholder">
                <i className="fas fa-chart-line me-2"></i>
                <p>No hay datos disponibles para el período seleccionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Filtros de fechas */}
        <div className="tenant-inc__date-filters">
          <div className="tenant-inc__date-filters-header">
            <h3>
              <i className="fas fa-filter me-2"></i> Filtrar Ingresos
            </h3>
          </div>
          <div className="tenant-inc__date-range-selector">
            <div className="tenant-inc__date-filter-group">
              <label htmlFor="tenant-inc-start-date">Fecha de inicio</label>
              <input
                type="date"
                id="tenant-inc-start-date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="tenant-inc__date-filter-group">
              <label htmlFor="tenant-inc-end-date">Fecha de fin</label>
              <input
                type="date"
                id="tenant-inc-end-date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            
            {/* Contenedor de botones en columna */}
            <div className="tenant-inc__button-column">
              {/* Botón de reporte arriba */}
              <button
                className="tenant-inc__btn-report"
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
              
              {/* Botones de filtro abajo */}
              <div className="tenant-inc__filter-buttons">
                <button
                  className="tenant-inc__btn-filter"
                  onClick={handleAplicarFiltros}
                  disabled={loadingPagos}
                >
                  <i className="fas fa-filter me-2"></i>
                  {loadingPagos ? 'Aplicando...' : 'Aplicar Filtros'}
                </button>
                
                {filtrosAplicados && (
                  <button
                    className="tenant-inc__btn-clear"
                    onClick={handleLimpiarFiltros}
                    disabled={loadingPagos}
                  >
                    <i className="fas fa-times me-2"></i>
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de ingresos recientes */}
        <div className="tenant-inc__recent-income">
          <div className="tenant-inc__recent-header">
            <h3>Ingresos Registrados</h3>
          </div>
          <div className="table-responsive">
            <table
              className="table tenant-inc__table"
              id="tenant-inc-income-table"
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Método</th>
                  <th>Monto Neto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingPagos ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando pagos...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No se encontraron pagos en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago, index) => (
                    <tr key={pago.id_pago}>
                      <td data-label="#">{(currentPage - 1) * limit + index + 1}</td>
                      <td data-label="Fecha">{formatFecha(pago.pago.fechaPago)}</td>
                      <td data-label="Cliente">{pago.cliente.nombreCompleto}</td>
                      <td data-label="Email">{pago.cliente.email}</td>
                      <td data-label="Método">{pago.pago.Neto || 'N/A'}</td>
                      <td data-label="Monto">{formatMoneda(pago.pago.importe)}</td>
                      <td data-label="Acciones">
                        <button 
                          className="tenant-inc__view-btn view-btn"
                          onClick={() => handleVerDetalles(pago)}
                        >
                          <i className="fas fa-eye"></i> Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación simplificada */}
          {totalPages > 1 && (
            <div className="tenant-inc__pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button 
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default IngresosTenant;