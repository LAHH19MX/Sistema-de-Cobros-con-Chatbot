import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faSave, faSearch } from '@fortawesome/free-solid-svg-icons';
import { getClientes } from '../../api/clientesTenant';
import { createDeuda } from '../../api/deudasTenant';
import { validateDeudaForm, formatCurrency } from '../../utils/deudaValidation';
import type { ClienteTenant } from '../../api/clientesTenant';
import type { DeudaFormData, DeudaValidationErrors } from '../../utils/deudaValidation';
import '../../styles/tenant/UpdateClient.css';

const AddDeuda: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteTenant[]>([]);
  const [clientesCompletos, setClientesCompletos] = useState<ClienteTenant[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteTenant | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<DeudaFormData>({
    monto_original: '',
    descripcion: '',
    fecha_emision: today,
    fecha_vencimiento: '',
    id_cliente: ''
  });
  
  const [errors, setErrors] = useState<DeudaValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Función para agregar 24 horas a una fecha y convertirla a UTC
  const add24HoursToDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString();
  };

  // Función para mostrar fecha con 24 horas agregadas
  const add24HoursForDisplay = (dateString: string): Date => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return new Date(date.getTime() + 24 * 60 * 60 * 1000);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validationErrors = validateDeudaForm(formData);
      setErrors(validationErrors);
    }
  }, [formData, touched]);

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await getClientes({ limit: 100 });
      setClientesCompletos(response.data.data);
      setClientes(response.data.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    if (busquedaCliente.trim() === '') {
      setClientes(clientesCompletos);
    } else {
      const searchLower = busquedaCliente.toLowerCase();
      const filtered = clientesCompletos.filter(cliente => 
        `${cliente.nombre_cliente} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`.toLowerCase().includes(searchLower) ||
        cliente.email_cliente.toLowerCase().includes(searchLower) ||
        cliente.telefono_cliente.includes(busquedaCliente)
      );
      setClientes(filtered);
    }
  }, [busquedaCliente, clientesCompletos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'monto_original') {
      const formattedValue = formatCurrency(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const seleccionarCliente = (cliente: ClienteTenant) => {
    setClienteSeleccionado(cliente);
    setFormData(prev => ({
      ...prev,
      id_cliente: cliente.id_cliente
    }));
    setBusquedaCliente(`${cliente.nombre_cliente} ${cliente.apellido_paterno}`);
    setMostrarResultados(false);
    setTouched(prev => ({ ...prev, id_cliente: true }));
  };

  const formatMoneda = (monto: string) => {
    const numero = parseFloat(monto);
    if (isNaN(numero)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numero);
  };

  // Función para formatear fecha en formato dd/MM/yyyy
  const formatFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // CORRECCIÓN PRINCIPAL: Conversión de tipos para el backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched = Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);

    const validationErrors = validateDeudaForm(formData);
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

    const result = await Swal.fire({
      title: '¿Confirmar registro de deuda?',
      html: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${clienteSeleccionado?.nombre_cliente} ${clienteSeleccionado?.apellido_paterno}</p>
          <p><strong>Monto:</strong> ${formatMoneda(formData.monto_original)}</p>
          <p><strong>Concepto:</strong> ${formData.descripcion}</p>
          <p><strong>Vencimiento:</strong> ${formatFecha(add24HoursForDisplay(formData.fecha_vencimiento))}</p>
        </div>
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
      setSaving(true);
      
      // CONVERSIÓN DE TIPOS PARA EL BACKEND
      const dataToSend = {
        // Convertir monto a número decimal
        monto_original: parseFloat(formData.monto_original.replace(/,/g, '')),
        
        // Saldo pendiente inicial = monto original
        saldo_pendiente: parseFloat(formData.monto_original.replace(/,/g, '')),
        
        // Mantener descripción
        descripcion: formData.descripcion,
        
        // Convertir fechas a formato ISO
        fecha_emision: new Date(formData.fecha_emision).toISOString(),
        
        // Aplicar corrección de 24 horas a la fecha de vencimiento
        fecha_vencimiento: add24HoursToDate(formData.fecha_vencimiento),
        
        // Mantener ID cliente
        id_cliente: formData.id_cliente,
        
        estado_deuda: 'pendiente',  // Valor por defecto
        tasa_interes: 0              
      };

      await createDeuda(dataToSend);

      await Swal.fire({
        icon: 'success',
        title: '¡Deuda registrada!',
        text: 'La deuda se ha registrado exitosamente y se ha enviado un email de notificación al cliente',
        confirmButtonColor: '#3085d6'
      });

      navigate('/tenant/deudas');
    } catch (error: any) {
      console.error('Error:', error);
      
      // Mostrar detalles del error del backend
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'No se pudo registrar la deuda';
      
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: errorMessage,
        confirmButtonColor: '#d33'
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-search-container')) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loadingClientes) {
    return (
      <div className="client-udp d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando clientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="client-udp">
      <div className="client-udp__container">
        <div className="client-udp__header">
          <h1 className="client-udp__title">Registrar Nueva Deuda</h1>
          <p className="client-udp__description">
            Complete todos los campos para registrar una nueva deuda.
          </p>
        </div>
        
        <form className="client-udp__form" onSubmit={handleSubmit}>
          <div className="client-udp__form-header">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="client-udp__form-icon" />
            <span>Datos de la Deuda</span>
          </div>
          
          <div className="client-udp__form-body">
            <div className="client-udp__form-row">
              {/* Buscador de Clientes */}
              <div className="client-udp__form-group client-udp__form-group--full">
                <label className="client-udp__form-label">Cliente *</label>
                <div className="client-search-container">
                  <div className="client-search-input">
                    <input
                      type="text"
                      className={`client-udp__form-control ${touched.id_cliente && errors.id_cliente ? 'is-invalid' : ''}`}
                      placeholder="Buscar cliente por nombre, email o teléfono..."
                      value={busquedaCliente}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarResultados(true);
                        if (clienteSeleccionado) {
                          setClienteSeleccionado(null);
                          setFormData(prev => ({ ...prev, id_cliente: '' }));
                        }
                      }}
                      onFocus={() => setMostrarResultados(true)}
                      disabled={saving}
                    />
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  </div>
                  
                  {mostrarResultados && clientes.length > 0 && !clienteSeleccionado && (
                    <div className="client-search-results">
                      {clientes.slice(0, 5).map(cliente => (
                        <div 
                          key={cliente.id_cliente}
                          className="client-result-item"
                          onClick={() => seleccionarCliente(cliente)}
                        >
                          <div className="client-name">
                            {cliente.nombre_cliente} {cliente.apellido_paterno} {cliente.apellido_materno}
                          </div>
                          <div className="client-phone">{cliente.email_cliente} - {cliente.telefono_cliente}</div>
                        </div>
                      ))}
                      {clientes.length > 5 && (
                        <div className="client-result-item" style={{ textAlign: 'center', fontSize: '0.9em', opacity: 0.7 }}>
                          ... y {clientes.length - 5} más resultados
                        </div>
                      )}
                    </div>
                  )}
                  
                  {touched.id_cliente && errors.id_cliente && (
                    <div className="invalid-feedback d-block">{errors.id_cliente}</div>
                  )}
                  
                  {clienteSeleccionado && (
                    <div className="selected-client-info">
                      <strong>Cliente seleccionado:</strong> {clienteSeleccionado.nombre_cliente} {clienteSeleccionado.apellido_paterno} - {clienteSeleccionado.email_cliente}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Monto de la Deuda */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Monto de la Deuda *</label>
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    type="text"
                    className={`client-udp__form-control ${touched.monto_original && errors.monto_original ? 'is-invalid' : ''}`}
                    name="monto_original"
                    value={formData.monto_original}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
                {touched.monto_original && errors.monto_original && (
                  <div className="invalid-feedback">{errors.monto_original}</div>
                )}
              </div>
              
              {/* Fecha de Emisión */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Fecha de Emisión *</label>
                <input
                  type="date"
                  className={`client-udp__form-control ${touched.fecha_emision && errors.fecha_emision ? 'is-invalid' : ''}`}
                  name="fecha_emision"
                  value={formData.fecha_emision}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.fecha_emision && errors.fecha_emision && (
                  <div className="invalid-feedback">{errors.fecha_emision}</div>
                )}
              </div>
              
              {/* Fecha de Vencimiento */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Fecha de Vencimiento *</label>
                <input
                  type="date"
                  className={`client-udp__form-control ${touched.fecha_vencimiento && errors.fecha_vencimiento ? 'is-invalid' : ''}`}
                  name="fecha_vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  min={formData.fecha_emision}
                  disabled={saving}
                />
                {touched.fecha_vencimiento && errors.fecha_vencimiento && (
                  <div className="invalid-feedback">{errors.fecha_vencimiento}</div>
                )}
              </div>
              
              {/* Descripción de la Deuda */}
              <div className="client-udp__form-group client-udp__form-group--full">
                <label className="client-udp__form-label">Descripción *</label>
                <textarea
                  className={`client-udp__form-control ${touched.descripcion && errors.descripcion ? 'is-invalid' : ''}`}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Descripción de la deuda, servicio o producto relacionado..."
                  rows={3}
                  disabled={saving}
                />
                {touched.descripcion && errors.descripcion && (
                  <div className="invalid-feedback">{errors.descripcion}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="client-udp__form-footer">
            <button 
              type="button" 
              className="client-udp__btn-update btn-cancel"
              onClick={() => navigate('/tenant/deudas')}
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="client-udp__btn-update"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="client-udp__btn-icon" />
                  Registrar Deuda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeuda;