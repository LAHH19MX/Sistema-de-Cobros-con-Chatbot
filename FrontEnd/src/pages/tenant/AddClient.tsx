import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { createCliente } from '../../api/clientesTenant';
import { validateClienteForm, formatPhoneNumber, cleanPhoneNumber } from '../../utils/clienteValidation';
import type { ClienteFormData, ValidationErrors } from '../../utils/clienteValidation';
import '../../styles/tenant/UpdateClient.css';

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      // Formatear teléfono
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

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // Confirmar registro
    const result = await Swal.fire({
      title: '¿Confirmar registro?',
      html: `
        <p>¿Está seguro de registrar al cliente:</p>
        <strong>${formData.nombre_cliente} ${formData.apellido_paterno} ${formData.apellido_materno}</strong>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      
      // Preparar datos para enviar (limpiar teléfono)
      const dataToSend = {
        ...formData,
        telefono_cliente: cleanPhoneNumber(formData.telefono_cliente)
      };

      await createCliente(dataToSend);

      await Swal.fire({
        icon: 'success',
        title: '¡Cliente registrado!',
        text: 'El cliente se ha registrado exitosamente',
        confirmButtonColor: '#3085d6'
      });

      navigate('/tenant/clientes');
    } catch (error: any) {
      console.error('Error:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: error.response?.data?.error || 'No se pudo registrar el cliente',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-udp">
      <div className="client-udp__container">
        <div className="client-udp__header">
          <h1 className="client-udp__title">Registrar Nuevo Cliente</h1>
          <p className="client-udp__description">
            Complete todos los campos requeridos y haga clic en "Registrar Cliente" para agregar un nuevo cliente.
          </p>
        </div>
        
        <form className="client-udp__form" onSubmit={handleSubmit}>
          <div className="client-udp__form-header">
            <FontAwesomeIcon icon={faUserPlus} className="client-udp__form-icon" />
            <span>Datos del Nuevo Cliente</span>
          </div>
          
          <div className="client-udp__form-body">
            <div className="client-udp__form-row">
              {/* Nombre */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Nombre *</label>
                <input 
                  type="text"
                  name="nombre_cliente"
                  className={`client-udp__form-control ${touched.nombre_cliente && errors.nombre_cliente ? 'is-invalid' : ''}`}
                  placeholder="Ingrese el nombre"
                  value={formData.nombre_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
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
                  placeholder="Ingrese el apellido paterno"
                  value={formData.apellido_paterno}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
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
                  placeholder="Ingrese el apellido materno"
                  value={formData.apellido_materno}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
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
                  placeholder="ejemplo@email.com"
                  value={formData.email_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
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
                  placeholder="(555) 123-4567"
                  value={formData.telefono_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  maxLength={14}
                />
                {touched.telefono_cliente && errors.telefono_cliente && (
                  <div className="invalid-feedback">{errors.telefono_cliente}</div>
                )}
              </div>
              
              {/* Dirección */}
              <div className="client-udp__form-group client-udp__form-group--full">
                <label className="client-udp__form-label">Dirección *</label>
                <input 
                  type="text"
                  name="direccion_cliente"
                  className={`client-udp__form-control ${touched.direccion_cliente && errors.direccion_cliente ? 'is-invalid' : ''}`}
                  placeholder="Av. Revolución 123, Col. Centro, Ciudad de México"
                  value={formData.direccion_cliente}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="client-udp__btn-icon" />
                  Registrar Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClient;