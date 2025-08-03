import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  getMorosos, 
  enviarNotificacionMoroso
} from '../../api/morososTenant';
import type { ClienteMoroso } from '../../api/morososTenant';
import '../../styles/tenant/MorososTenant.css';

const MorososTenant: React.FC = () => {
  const navigate = useNavigate();
  const [morosos, setMorosos] = useState<ClienteMoroso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    dias_retraso: '0',
    monto_min: '0',
    monto_max: '0',
    orden: 'mayor_deuda'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1
  });

  // Cargar morosos al montar o cambiar filtros/página
  useEffect(() => {
    const cargarMorosos = async () => {
      try {
        setLoading(true);
        
        // Convertir filtros a números y preparar parámetros
        const params: Record<string, any> = {
          page: pagination.page,
          limit: pagination.limit
        };

        // Solo agregar parámetros numéricos si no son '0'
        if (filtros.dias_retraso !== '0') {
          params.dias_retraso = Number(filtros.dias_retraso);
        }
        if (filtros.monto_min !== '0') {
          params.monto_min = Number(filtros.monto_min);
        }
        if (filtros.monto_max !== '0') {
          params.monto_max = Number(filtros.monto_max);
        }
        
        const response = await getMorosos(params);
        setMorosos(response.data.data);
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

  // Manejadores de cambios en filtros
  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Generar números de página con puntos suspensivos
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

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Enviar notificación
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

  // Ver detalles
  const verDetalles = (id: string) => {
    navigate(`/tenant/morosos/${id}`);
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
        </p>
      </header>

      <div className="tenant-mor__filters-section">
        <div className="tenant-mor__filters-header">
          <h5 className="tenant-mor__filters-title">Filtros de búsqueda</h5>
          <button
            className="tenant-mor__btn-report btn-report rounded"
            data-bs-toggle="modal"
            data-bs-target="#reportMorososModal"
          >
            <i className="fas fa-download me-2"></i>Generar Reporte
          </button>
        </div>
        <div className="tenant-mor__filters-row">
          <div className="tenant-mor__filter-group">
            <label>Días de atraso</label>
            <select 
              name="dias_retraso"
              className="form-select"
              value={filtros.dias_retraso}
              onChange={handleFiltroChange}
            >
              <option value="0">Todos</option>
              <option value="30">1-30 días</option>
              <option value="60">31-60 días</option>
              <option value="90">61-90 días</option>
              <option value="91">Más de 90 días</option>
            </select>
          </div>
          <div className="tenant-mor__filter-group">
            <label>Rango de deuda</label>
            <select 
              name="monto_min"
              className="form-select"
              value={filtros.monto_min}
              onChange={handleFiltroChange}
            >
              <option value="0">Todos</option>
              <option value="1">$0 - $5,000</option>
              <option value="5001">$5,001 - $15,000</option>
              <option value="15001">$15,001 - $30,000</option>
              <option value="30001">Más de $30,000</option>
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
                <th>Deudas</th>
                <th>Días de Atraso</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {morosos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
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
                    <td>{moroso.cantidadDeudas}</td>
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
                          onClick={() => verDetalles(moroso.cliente.id_cliente)}
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
                    <div>
                      <i className="fas fa-file-invoice me-2"></i>
                      {moroso.cantidadDeudas} deuda{moroso.cantidadDeudas !== 1 ? 's' : ''}
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
                      onClick={() => verDetalles(moroso.cliente.id_cliente)}
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