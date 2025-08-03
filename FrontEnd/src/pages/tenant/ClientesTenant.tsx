import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getClientes, deleteCliente } from '../../api/clientesTenant';
import { getSocket } from '../../config/socket';
import type { ClienteTenant, ClientesResponse } from '../../api/clientesTenant';
import '../../styles/tenant/ClientesTenant.css';

const ClientesTenant: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const limit = 8;

  // Cargar clientes
  const cargarClientes = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const response = await getClientes({ 
        page, 
        limit, 
        search 
      });
      
      setClientes(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.totalPages);
      setTotalClientes(response.data.pagination.total);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Socket.io listeners
  useEffect(() => {
    cargarClientes();

    const socket = getSocket();
    if (socket) {
      socket.on('cliente:created', () => {
        cargarClientes(currentPage, searchTerm);
      });

      socket.on('cliente:updated', () => {
        cargarClientes(currentPage, searchTerm);
      });

      socket.on('cliente:deleted', () => {
        cargarClientes(currentPage, searchTerm);
      });
    }

    return () => {
      if (socket) {
        socket.off('cliente:created');
        socket.off('cliente:updated');
        socket.off('cliente:deleted');
      }
    };
  }, []);

  // Buscar clientes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    cargarClientes(1, value);
  };

  // Cambiar página
  const handlePageChange = (page: number) => {
    cargarClientes(page, searchTerm);
  };

  // Ver detalles del cliente
  const handleViewDetails = (cliente: ClienteTenant) => {
    Swal.fire({
      title: 'Detalles del Cliente',
      html: `
        <div style="text-align: left;">
          <p><strong>ID:</strong> ${cliente.id_cliente}</p>
          <p><strong>Nombre:</strong> ${cliente.nombre_cliente} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}</p>
          <p><strong>Email:</strong> ${cliente.email_cliente}</p>
          <p><strong>Teléfono:</strong> ${cliente.telefono_cliente}</p>
          <p><strong>Dirección:</strong> ${cliente.direccion_cliente || 'No especificada'}</p>
          <p><strong>Estado:</strong> ${cliente.estado_cliente === 'true' ? 'Activo' : 'Inactivo'}</p>
          <p><strong>Registrado:</strong> ${new Date(cliente.fecha_registro).toLocaleDateString('es-MX')}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6'
    });
  };

  // Eliminar cliente
  const handleDelete = async (cliente: ClienteTenant) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar a ${cliente.nombre_cliente} ${cliente.apellido_paterno}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteCliente(cliente.id_cliente);
        Swal.fire('Eliminado', 'El cliente ha sido eliminado.', 'success');
        cargarClientes(currentPage, searchTerm);
      } catch (error: any) {
        Swal.fire(
          'Error', 
          error.response?.data?.error || 'No se pudo eliminar el cliente', 
          'error'
        );
      }
    }
  };

  // Función para manejar el registro de nuevo cliente
  const handleNewClient = () => {
    navigate('/tenant/clientes/nuevo');
  };

  // Función para manejar la edición de cliente
  const handleEditClient = (id: string) => {
    navigate(`/tenant/clientes/editar/${id}`);
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

  if (loading && clientes.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="tenant-clients">
      {/* Encabezado de página (solo desktop) */}
      <header className="tenant-clients__header d-none d-md-block">
        <h1 className="tenant-clients__title">Gestión de Clientes</h1>
        <p className="tenant-clients__subtitle">
          Administra la información de tus clientes
        </p>
      </header>

      {/* Cuerpo principal */}
      <div className="tenant-clients__main">
        {/* Barra de acciones */}
        <div className="tenant-clients__actions">
          <button
            className="btn btn-primary-custom"
            onClick={handleNewClient}
          >
            <i className="fas fa-plus-circle me-2" />
            Registrar Nuevo Cliente
          </button>

          <div className="search-box">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="fas fa-search" />
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="tenant-clients__table">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th className='text-center'>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente, index) => (
                    <tr key={cliente.id_cliente}>
                      <td data-label="ID">{(currentPage - 1) * limit + index + 1}</td>
                      <td data-label="Nombre">
                        <span className="text-truncate-custom" title={cliente.nombre_cliente}>
                          {cliente.nombre_cliente}
                        </span>
                      </td>
                      <td data-label="Apellidos">
                        <span 
                          className="text-truncate-custom" 
                          title={`${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`}
                        >
                          {cliente.apellido_paterno} {cliente.apellido_materno || ''}
                        </span>
                      </td>
                      <td data-label="Dirección">
                        <span
                          className="text-truncate-custom small"
                          title={cliente.direccion_cliente || 'No especificada'}
                        >
                          {cliente.direccion_cliente || 'No especificada'}
                        </span>
                      </td>
                      <td data-label="Teléfono">{cliente.telefono_cliente}</td>
                      <td data-label="Email">
                        <span
                          className="text-truncate-custom small"
                          title={cliente.email_cliente}
                        >
                          {cliente.email_cliente}
                        </span>
                      </td>
                      <td data-label="Acciones">
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-view"
                            title="Ver detalles"
                            onClick={() => handleViewDetails(cliente)}
                          >
                            <i className="fas fa-eye" /> Detalles
                          </button>
                          <button
                            className="btn-action btn-edit"
                            title="Editar"
                            onClick={() => handleEditClient(cliente.id_cliente)}
                          >
                            <i className="fas fa-edit" /> Editar
                          </button>
                          <button
                            className="btn-action btn-delete"
                            title="Eliminar"
                            onClick={() => handleDelete(cliente)}
                          >
                            <i className="fas fa-trash-alt" /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Información + paginación */}
          <div className="table-footer">
            <span className="showing-entries">
              Mostrando {clientes.length} de {totalClientes} clientes registrados
            </span>

            {totalPages > 1 && (
              <nav aria-label="Paginación de tabla">
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <a 
                      className="page-link" 
                      href="#" 
                      aria-label="Anterior"
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
                      aria-label="Siguiente"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                    >
                      &raquo;
                    </a>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientesTenant;