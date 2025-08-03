import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserEdit, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { getClienteById, updateCliente } from '../../api/clientesTenant';
import { validateClienteForm, formatPhoneNumber, cleanPhoneNumber } from '../../utils/clienteValidation';
import type { ClienteTenant } from '../../api/clientesTenant';
import type { ClienteFormData, ValidationErrors } from '../../utils/clienteValidation';
import '../../styles/tenant/UpdateClient.css';

const UpdateClient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clienteOriginal, setClienteOriginal] = useState<ClienteTenant | null>(null);
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre_cliente: '',
    apellido_paterno: '',
    apellido_materno: '',
    email_cliente: '',
    telefono_cliente: '',
    direccion_cliente: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Cargar datos del cliente
  useEffect(() => {
    const cargarCliente = async () => {
      if (!id) {
        navigate('/tenant/clientes');
        return;
      }

      try {
        setLoading(true);
        const response = await getClienteById(id);
        const cliente = response.data;
        
        setClienteOriginal(cliente);
        setFormData({
          nombre_cliente: cliente.nombre_cliente,
          apellido_paterno: cliente.apellido_paterno,
          apellido_materno: cliente.apellido_materno || '',
          email_cliente: cliente.email_cliente,
          telefono_cliente: formatPhoneNumber(cliente.telefono_cliente),
          direccion_cliente: cliente.direccion_cliente || ''
        });
      } catch (error) {
        console.error('Error cargando cliente:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del cliente',
          confirmButtonColor: '#d33'
        });
        navigate('/tenant/clientes');
      } finally {
        setLoading(false);
      }
    };

    cargarCliente();
  }, [id, navigate]);

  // Validar formulario cuando cambian los datos
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validationErrors = validateClienteForm(formData);
      setErrors(validationErrors);
    }
  }, [formData, touched]);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefono_cliente') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Marcar campo como tocado
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Verificar si hubo cambios
  const hasChanges = (): boolean => {
    if (!clienteOriginal) return false;
    
    return (
      formData.nombre_cliente !== clienteOriginal.nombre_cliente ||
      formData.apellido_paterno !== clienteOriginal.apellido_paterno ||
      formData.apellido_materno !== (clienteOriginal.apellido_materno || '') ||
      formData.email_cliente !== clienteOriginal.email_cliente ||
      cleanPhoneNumber(formData.telefono_cliente) !== clienteOriginal.telefono_cliente ||
      formData.direccion_cliente !== (clienteOriginal.direccion_cliente || '')
    );
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si hay cambios
    if (!hasChanges()) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se han realizado modificaciones',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Marcar todos los campos como tocados
    const allTouched = Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);

    // Validar
    const validationErrors = validateClienteForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Errores en el formulario',
        text: 'Por favor corrija los errores antes de continuar',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Confirmar actualización
    const result = await Swal.fire({
      title: '¿Confirmar actualización?',
      html: `
        <p>¿Está seguro de actualizar los datos del cliente:</p>
        <strong>${formData.nombre_cliente} ${formData.apellido_paterno} ${formData.apellido_materno}</strong>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      
      // Preparar solo los campos que cambiaron
      const dataToSend: any = {};
      
      if (formData.nombre_cliente !== clienteOriginal!.nombre_cliente) {
        dataToSend.nombre_cliente = formData.nombre_cliente;
      }
      if (formData.apellido_paterno !== clienteOriginal!.apellido_paterno) {
        dataToSend.apellido_paterno = formData.apellido_paterno;
      }
      if (formData.apellido_materno !== (clienteOriginal!.apellido_materno || '')) {
        dataToSend.apellido_materno = formData.apellido_materno || null;
      }
      if (formData.email_cliente !== clienteOriginal!.email_cliente) {
        dataToSend.email_cliente = formData.email_cliente;
      }
      if (cleanPhoneNumber(formData.telefono_cliente) !== clienteOriginal!.telefono_cliente) {
        dataToSend.telefono_cliente = cleanPhoneNumber(formData.telefono_cliente);
      }
      if (formData.direccion_cliente !== (clienteOriginal!.direccion_cliente || '')) {
        dataToSend.direccion_cliente = formData.direccion_cliente || null;
      }

      await updateCliente(id!, dataToSend);

      await Swal.fire({
        icon: 'success',
        title: '¡Cliente actualizado!',
        text: 'Los datos se han actualizado exitosamente',
        confirmButtonColor: '#3085d6'
      });

      navigate('/tenant/clientes');
    } catch (error: any) {
      console.error('Error:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: error.response?.data?.error || 'No se pudo actualizar el cliente',
        confirmButtonColor: '#d33'
      });
    } finally {
      setSaving(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="client-udp d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!clienteOriginal) {
    return (
      <div className="client-udp">
        <div className="alert alert-danger">Cliente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="client-udp">
      <div className="client-udp__container">
        <div className="client-udp__header">
          <h1 className="client-udp__title">Actualizar Información del Cliente</h1>
          <p className="client-udp__description">
            Modifique los campos necesarios y haga clic en "Actualizar Cliente" para guardar los cambios.
          </p>
        </div>
        
        <form className="client-udp__form" onSubmit={handleSubmit}>
          <div className="client-udp__form-header">
            <FontAwesomeIcon icon={faUserEdit} className="client-udp__form-icon" />
            <span>Datos del Cliente</span>
          </div>
          
          <div className="client-udp__form-body">
            <div className="client-udp__form-row">
              {/* ID (no editable) */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">ID del Cliente</label>
                <input 
                  type="text" 
                  className="client-udp__form-control" 
                  value={`#${clienteOriginal.id_cliente.substring(0, 8).toUpperCase()}`} 
                  disabled 
                />
              </div>
              
              {/* Estado */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Estado</label>
                <input 
                  type="text" 
                  className="client-udp__form-control" 
                  value={clienteOriginal.estado_cliente === 'true' ? 'Activo' : 'Inactivo'} 
                  disabled 
                />
              </div>
              
              {/* Nombre */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Nombre *</label>
                <input 
                  type="text"
                  name="nombre_cliente"
                  className={`client-udp__form-control ${touched.nombre_cliente && errors.nombre_cliente ? 'is-invalid' : ''}`}
                  value={formData.nombre_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.nombre_cliente && errors.nombre_cliente && (
                  <div className="invalid-feedback">{errors.nombre_cliente}</div>
                )}
              </div>
              
              {/* Apellido Paterno */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Apellido Paterno *</label>
                <input 
                  type="text"
                  name="apellido_paterno"
                  className={`client-udp__form-control ${touched.apellido_paterno && errors.apellido_paterno ? 'is-invalid' : ''}`}
                  value={formData.apellido_paterno}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.apellido_paterno && errors.apellido_paterno && (
                  <div className="invalid-feedback">{errors.apellido_paterno}</div>
                )}
              </div>
              
              {/* Apellido Materno */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Apellido Materno</label>
                <input 
                  type="text"
                  name="apellido_materno"
                  className={`client-udp__form-control ${touched.apellido_materno && errors.apellido_materno ? 'is-invalid' : ''}`}
                  value={formData.apellido_materno}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.apellido_materno && errors.apellido_materno && (
                  <div className="invalid-feedback">{errors.apellido_materno}</div>
                )}
              </div>
              
              {/* Email */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Email *</label>
                <input 
                  type="email"
                  name="email_cliente"
                  className={`client-udp__form-control ${touched.email_cliente && errors.email_cliente ? 'is-invalid' : ''}`}
                  value={formData.email_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.email_cliente && errors.email_cliente && (
                  <div className="invalid-feedback">{errors.email_cliente}</div>
                )}
              </div>
              
              {/* Teléfono */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Número de Teléfono *</label>
                <input 
                  type="tel"
                  name="telefono_cliente"
                  className={`client-udp__form-control ${touched.telefono_cliente && errors.telefono_cliente ? 'is-invalid' : ''}`}
                  value={formData.telefono_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                  maxLength={14}
                />
                {touched.telefono_cliente && errors.telefono_cliente && (
                  <div className="invalid-feedback">{errors.telefono_cliente}</div>
                )}
              </div>
              
              {/* Fecha de Registro (no editable) */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Fecha de Registro</label>
                <input 
                  type="text" 
                  className="client-udp__form-control" 
                  value={formatDate(clienteOriginal.fecha_registro)} 
                  disabled 
                />
              </div>
              
              {/* Dirección */}
              <div className="client-udp__form-group client-udp__form-group--full">
                <label className="client-udp__form-label">Dirección *</label>
                <input 
                  type="text"
                  name="direccion_cliente"
                  className={`client-udp__form-control ${touched.direccion_cliente && errors.direccion_cliente ? 'is-invalid' : ''}`}
                  value={formData.direccion_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.direccion_cliente && errors.direccion_cliente && (
                  <div className="invalid-feedback">{errors.direccion_cliente}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="client-udp__form-footer">
            <button 
              type="submit" 
              className="client-udp__btn-update"
              disabled={saving || !hasChanges()}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSyncAlt} className="client-udp__btn-icon" />
                  Actualizar Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateClient;