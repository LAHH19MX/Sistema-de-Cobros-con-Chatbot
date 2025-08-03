import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getDashboardStats, getUltimosEnlaces } from '../../api/dashboardTenant';
import { getSocket } from '../../config/socket';
import type { DashboardStats, EnlacePago } from '../../api/dashboardTenant';
import '../../styles/tenant/DashboardTenant.css';

const DashboardTenant: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalCobrado: 0,
    deudasPendientes: 0
  });
  const [enlaces, setEnlaces] = useState<EnlacePago[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      const [statsRes, enlacesRes] = await Promise.all([
        getDashboardStats(),
        getUltimosEnlaces()
      ]);
      
      setStats(statsRes.data);
      setEnlaces(enlacesRes.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Socket.io listeners
  useEffect(() => {
    cargarDatos();

    const socket = getSocket();
    if (socket) {
      socket.on('cliente:created', cargarDatos);
      socket.on('pago:received', cargarDatos);
      socket.on('deuda:created', cargarDatos);
    }

    return () => {
      if (socket) {
        socket.off('cliente:created', cargarDatos);
        socket.off('pago:received', cargarDatos);
        socket.off('deuda:created', cargarDatos);
      }
    };
  }, []);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Formatear fecha (con manejo de errores)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? 'Fecha inválida' 
      : date.toLocaleDateString('es-MX');
  };

  // Mostrar detalles del enlace
  const mostrarDetalles = (enlace: EnlacePago) => {
    Swal.fire({
      title: 'Detalles del Movimiento',
      html: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${enlace.nombre}</p>
          <p><strong>Fecha:</strong> ${formatDate(enlace.fecha)}</p>
          <p><strong>Referencia:</strong> ${enlace.referencia}</p>
          <p><strong>Estado:</strong> <span class="${`tenant-status tenant-status--${getStatusClass(enlace.estado)}`}">${enlace.estado}</span></p>
          <p><strong>Concepto:</strong> ${enlace.concepto}</p>
          <p><strong>Monto:</strong> ${formatCurrency(enlace.monto)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6'
    });
  };

  // Obtener clase CSS para el estado
  const getStatusClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pagado': return 'paid';
      case 'pendiente': return 'pending';
      case 'expirado':
      case 'vencido': return 'overdue';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="tenant-dashboard d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="tenant-dashboard">
      {/* Tarjetas de estadísticas */}
      <div className="tenant-dashboard__stats container">
        <div className="row">
          {/* Card 1 - Clientes */}
          <div className="col-md-4">
            <article className="tenant-card">
              <div className="tenant-card__main">
                <div className="tenant-card__icon tenant-card__icon--clients">
                  <i className="fas fa-users" />
                </div>
                <div className="tenant-card__info">
                  <h3>{stats.totalClientes}</h3>
                  <p>Clientes Este Mes</p>
                </div>
              </div>
              <div className="tenant-card__footer">
                <a 
                  className="tenant-card__link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/tenant/clientes');
                  }}
                >
                  <span>Ver clientes</span>
                  <i className="fas fa-arrow-right" />
                </a>
              </div>
            </article>
          </div>

          {/* Card 2 - Cobrado */}
          <div className="col-md-4">
            <article className="tenant-card">
              <div className="tenant-card__main">
                <div className="tenant-card__icon tenant-card__icon--paid">
                  <i className="fas fa-check-circle" />
                </div>
                <div className="tenant-card__info">
                  <h3>{(stats.totalCobrado)}</h3>
                  <p>Pagos Cobrados</p>
                </div>
              </div>
              <div className="tenant-card__footer">
                <a
                  className="tenant-card__link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/tenant/ingresos');
                  }}
                >
                  <span>Ver ingresos</span>
                  <i className="fas fa-arrow-right" />
                </a>
              </div>
            </article>
          </div>

          {/* Card 3 - Deudas Pendientes */}
          <div className="col-md-4">
            <article className="tenant-card">
              <div className="tenant-card__main">
                <div className="tenant-card__icon tenant-card__icon--pending">
                  <i className="fas fa-clock" />
                </div>
                <div className="tenant-card__info">
                  <h3>{stats.deudasPendientes}</h3>
                  <p>Deudas Pendientes</p>
                </div>
              </div>
              <div className="tenant-card__footer">
                <a 
                  className="tenant-card__link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/tenant/deudas');
                  }}
                >
                  <span>Ver deudas</span>
                  <i className="fas fa-arrow-right" />
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className="tenant-movements container-fluid">
        <header className="tenant-movements__header">
          <h2>Movimientos Recientes</h2>
        </header>

        {/* Tabla (desktop) */}
        <div className="tenant-table__wrapper">
          <table className="tenant-table table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {enlaces.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    No hay movimientos recientes
                  </td>
                </tr>
              ) : (
                enlaces.map((enlace, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{enlace.nombre}</td>
                    <td>{formatDate(enlace.fecha)}</td>
                    <td>{enlace.referencia.substring(0, 10)}...</td>
                    <td>
                      <span className={`tenant-status tenant-status--${getStatusClass(enlace.estado)}`}>
                        {enlace.estado}
                      </span>
                    </td>
                    <td>{enlace.concepto}</td>
                    <td>{formatCurrency(enlace.monto)}</td>
                    <td>
                      <button 
                        className="tenant-btn rounded"
                        onClick={() => mostrarDetalles(enlace)}
                      >
                        <i className="fas fa-eye me-1" /> Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tarjetas (mobile) */}
        <div className="tenant-mobile">
          {enlaces.length === 0 ? (
            <div className="text-center p-4">
              
            </div>
          ) : (
            enlaces.map((enlace, index) => (
              <div key={index} className="tenant-mobile-card">
                <div className="tenant-mobile-card__row">
                  <span className="label">Nombre:</span>
                  <span className="value">{enlace.nombre}</span>
                </div>
                <div className="tenant-mobile-card__row">
                  <span className="label">Fecha:</span>
                  <span className="value">{formatDate(enlace.fecha)}</span>
                </div>
                <div className="tenant-mobile-card__row">
                  <span className="label">Referencia:</span>
                  <span className="value">{enlace.referencia.substring(0, 10)}...</span>
                </div>
                <div className="tenant-mobile-card__row">
                  <span className="label">Estado:</span>
                  <span className={`value tenant-status tenant-status--${getStatusClass(enlace.estado)}`}>
                    {enlace.estado}
                  </span>
                </div>
                <div className="tenant-mobile-card__row">
                  <span className="label">Concepto:</span>
                  <span className="value">{enlace.concepto}</span>
                </div>
                <div className="tenant-mobile-card__row">
                  <span className="label">Monto:</span>
                  <span className="value">{formatCurrency(enlace.monto)}</span>
                </div>
                <div className="tenant-mobile-card__row">
                  <button 
                    className="tenant-btn w-100"
                    onClick={() => mostrarDetalles(enlace)}
                  >
                    <i className="fas fa-eye me-1" /> Detalles
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardTenant;