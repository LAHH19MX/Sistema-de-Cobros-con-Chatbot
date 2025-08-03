import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getDeudas, getWidgetsDeudas, generarReporteDeudas } from '../../api/deudasTenant';
import { getSocket } from '../../config/socket';
import type { Deuda, DeudasResponse, WidgetsDeudas } from '../../api/deudasTenant';
import '../../styles/tenant/DeudasTenant.css';

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

  // Generar reporte
  const handleGenerarReporte = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Generar Reporte de Deudas',
      html: `
        <div style="text-align: left;">
          <label for="swal-desde" style="display: block; margin-bottom: 5px;">Fecha desde:</label>
          <input id="swal-desde" type="date" class="swal2-input" required>
          
          <label for="swal-hasta" style="display: block; margin-bottom: 5px; margin-top: 15px;">Fecha hasta:</label>
          <input id="swal-hasta" type="date" class="swal2-input" required>
          
          <label for="swal-estado" style="display: block; margin-bottom: 5px; margin-top: 15px;">Estado:</label>
          <select id="swal-estado" class="swal2-input">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      preConfirm: () => {
        const desde = (document.getElementById('swal-desde') as HTMLInputElement).value;
        const hasta = (document.getElementById('swal-hasta') as HTMLInputElement).value;
        const estado = (document.getElementById('swal-estado') as HTMLSelectElement).value;
        
        if (!desde || !hasta) {
          Swal.showValidationMessage('Por favor complete todos los campos');
          return false;
        }
        
        if (new Date(desde) > new Date(hasta)) {
          Swal.showValidationMessage('La fecha desde no puede ser mayor que la fecha hasta');
          return false;
        }
        
        return { desde, hasta, estado };
      }
    });

    if (formValues) {
      try {
        setGeneratingReport(true);
        const response = await generarReporteDeudas({
          desde: formValues.desde,
          hasta: formValues.hasta,
          estado: formValues.estado === 'todos' ? undefined : formValues.estado
        });

        // Aquí podrías mostrar el reporte o descargarlo
        await Swal.fire({
          icon: 'success',
          title: 'Reporte generado',
          text: `Se encontraron ${response.data.datos.length} deudas en el período seleccionado`,
          confirmButtonColor: '#3085d6'
        });
      } catch (error) {
        Swal.fire('Error', 'No se pudo generar el reporte', 'error');
      } finally {
        setGeneratingReport(false);
      }
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
      <div className="tenant-deudas__table">
        <div className="table-responsive">
          <table className="tenant-deudas-table table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Concepto</th>
                <th>Importe</th>
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
                    <td data-label="ID">DEB-{(currentPage - 1) * limit + index + 1}</td>
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
                    <td data-label="Importe">{formatMoneda(Number(deuda.saldo_pendiente))}</td>
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