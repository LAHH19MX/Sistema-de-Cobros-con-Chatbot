// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useInquilinos } from '../../context/TenantsContext';
import Swal from 'sweetalert2';
import '../../styles/admin/AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { inquilinos, loadInquilinos, loading } = useInquilinos();
  const [montoTotal] = useState(12450); 

  useEffect(() => {
    loadInquilinos();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const showInquilinoDetails = (inquilino: any) => {
    const suscripcionInfo = inquilino.suscripcion ? `
      <p><strong>Plan:</strong> ${inquilino.suscripcion.plan.nombre}</p>
      <p><strong>Precio:</strong> $${inquilino.suscripcion.plan.precio}</p>
      <p><strong>Estado suscripción:</strong> ${inquilino.suscripcion.estado}</p>
      <p><strong>Fecha inicio:</strong> ${formatDate(inquilino.suscripcion.fecha_inicio)}</p>
      <p><strong>Fecha renovación:</strong> ${formatDate(inquilino.suscripcion.fecha_renovacion)}</p>
    ` : '<p><strong>Plan:</strong> Sin plan activo</p>';

    Swal.fire({
      title: 'Información del Inquilino',
      html: `
        <div style="text-align: left;">
          <p><strong>ID:</strong> ${inquilino.id}</p>
          <p><strong>Nombre:</strong> ${inquilino.nombre}</p>
          <p><strong>Apellido Paterno:</strong> ${inquilino.apellido_paterno}</p>
          <p><strong>Apellido Materno:</strong> ${inquilino.apellido_materno || 'N/A'}</p>
          <p><strong>Email:</strong> ${inquilino.email}</p>
          <p><strong>Teléfono:</strong> ${inquilino.telefono || 'N/A'}</p>
          <p><strong>Estado:</strong> ${inquilino.estado ? 'Activo' : 'Inactivo'}</p>
          <p><strong>Fecha registro:</strong> ${formatDate(inquilino.fecha_registro)}</p>
          <hr>
          ${suscripcionInfo}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#F07177',
      width: '600px'
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Título */}
      <h1 className="admin-dashboard__title">Dashboard Administrativo</h1>

      {/* Cards de estadísticas */}
      <div className="admin-dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--users">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-card__info">
            <h3 className="stat-card__number">{inquilinos.length}</h3>
            <p className="stat-card__label">Total de Inquilinos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--money">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-card__info">
            <h3 className="stat-card__number">${montoTotal.toLocaleString('es-MX')}</h3>
            <p className="stat-card__label">Monto Total de Planes</p>
          </div>
        </div>
      </div>

      {/* Tabla de inquilinos */}
      <div className="admin-dashboard__table-container">
        <h2 className="admin-dashboard__subtitle">Clientes recientes</h2>
        
        {loading ? (
          <div className="admin-dashboard__loading">
            <i className="fas fa-spinner fa-spin"></i> Cargando...
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Num</th>
                <th>Nombre</th>
                <th>Nombre Empresa</th>
                <th>Fecha</th>
                <th>Plan</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inquilinos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    No hay inquilinos registrados
                  </td>
                </tr>
              ) : (
                inquilinos.map((inquilino, index) => (
                  <tr key={inquilino.id}>
                    <td>{index + 1}</td>
                    <td>{`${inquilino.apellido_paterno} ${inquilino.apellido_materno || ''} ${inquilino.nombre}`.trim()}</td>
                    <td>{inquilino.nombre}</td>
                    <td>{formatDate(inquilino.fecha_registro)}</td>
                    <td>
                      {inquilino.suscripcion ? (
                        <span className="admin-table__plan">
                          {inquilino.suscripcion.plan.nombre}
                        </span>
                      ) : (
                        <span className="admin-table__no-plan">Sin plan</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="admin-table__action-btn"
                        onClick={() => showInquilinoDetails(inquilino)}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;