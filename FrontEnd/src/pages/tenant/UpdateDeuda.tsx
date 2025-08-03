import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faSave } from '@fortawesome/free-solid-svg-icons';
import { getDeudaById, updateDeuda } from '../../api/deudasTenant';
import { validateDeudaForm, formatCurrency } from '../../utils/deudaValidation';
import type { Deuda } from '../../api/deudasTenant';
import type { DeudaValidationErrors } from '../../utils/deudaValidation';
import '../../styles/tenant/UpdateClient.css';

interface UpdateDeudaFormData {
  monto_original: string;
  saldo_pendiente: string;
  descripcion: string;
  fecha_vencimiento: string;
  estado_deuda: string;
}

const UpdateDeuda: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deudaOriginal, setDeudaOriginal] = useState<Deuda | null>(null);
  const [formData, setFormData] = useState<UpdateDeudaFormData>({
    monto_original: '',
    saldo_pendiente: '',
    descripcion: '',
    fecha_vencimiento: '',
    estado_deuda: ''
  });
  const [errors, setErrors] = useState<DeudaValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Cargar datos de la deuda
  useEffect(() => {
    const cargarDeuda = async () => {
      if (!id) {
        navigate('/tenant/deudas');
        return;
      }

      try {
        setLoading(true);
        const response = await getDeudaById(id);
        const deuda = response.data;
        
        setDeudaOriginal(deuda);
        setFormData({
          monto_original: deuda.monto_original.toString(),
          saldo_pendiente: deuda.saldo_pendiente.toString(),
          descripcion: deuda.descripcion,
          fecha_vencimiento: deuda.fecha_vencimiento.split('T')[0],
          estado_deuda: deuda.estado_deuda
        });
      } catch (error) {
        console.error('Error cargando deuda:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información de la deuda',
          confirmButtonColor: '#d33'
        });
        navigate('/tenant/deudas');
      } finally {
        setLoading(false);
      }
    };

    cargarDeuda();
  }, [id, navigate]);

  // Validar cambios en los campos editables
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validationErrors: DeudaValidationErrors = {};
      
      // Validar monto original
      const montoOriginal = parseFloat(formData.monto_original);
      if (!formData.monto_original || isNaN(montoOriginal)) {
        validationErrors.monto_original = 'El monto es requerido';
      } else if (montoOriginal <= 0) {
        validationErrors.monto_original = 'El monto debe ser mayor a 0';
      }

      // Validar saldo pendiente
      const saldoPendiente = parseFloat(formData.saldo_pendiente);
      if (!formData.saldo_pendiente || isNaN(saldoPendiente)) {
        validationErrors.saldo_pendiente = 'El saldo es requerido';
      } else if (saldoPendiente < 0) {
        validationErrors.saldo_pendiente = 'El saldo no puede ser negativo';
      } else if (saldoPendiente > montoOriginal) {
        validationErrors.saldo_pendiente = 'El saldo no puede ser mayor al monto original';
      }

      // Validar descripción
      if (!formData.descripcion.trim()) {
        validationErrors.descripcion = 'La descripción es requerida';
      }

      // Validar fecha de vencimiento
      if (!formData.fecha_vencimiento) {
        validationErrors.fecha_vencimiento = 'La fecha de vencimiento es requerida';
      }

      setErrors(validationErrors);
    }
  }, [formData, touched]);

  // Manejar cambios en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'monto_original' || name === 'saldo_pendiente') {
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

  // Marcar campo como tocado
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Verificar si hubo cambios
  const hasChanges = (): boolean => {
    if (!deudaOriginal) return false;
    
    return (
      parseFloat(formData.monto_original) !== parseFloat(deudaOriginal.monto_original.toString()) ||
      parseFloat(formData.saldo_pendiente) !== parseFloat(deudaOriginal.saldo_pendiente.toString()) ||
      formData.descripcion !== deudaOriginal.descripcion ||
      formData.fecha_vencimiento !== deudaOriginal.fecha_vencimiento.split('T')[0] ||
      formData.estado_deuda !== deudaOriginal.estado_deuda
    );
  };

  // Formatear moneda para mostrar
  const formatMoneda = (monto: string | number) => {
    const numero = typeof monto === 'string' ? parseFloat(monto) : monto;
    if (isNaN(numero)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numero);
  };

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX');
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
    if (Object.keys(errors).length > 0) {
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
        <div style="text-align: left;">
          <h5>Cambios a realizar:</h5>
          ${parseFloat(formData.monto_original) !== parseFloat(deudaOriginal!.monto_original.toString()) ? 
            `<p><strong>Monto:</strong> ${formatMoneda(deudaOriginal!.monto_original)} → ${formatMoneda(formData.monto_original)}</p>` : ''}
          ${parseFloat(formData.saldo_pendiente) !== parseFloat(deudaOriginal!.saldo_pendiente.toString()) ? 
            `<p><strong>Saldo:</strong> ${formatMoneda(deudaOriginal!.saldo_pendiente)} → ${formatMoneda(formData.saldo_pendiente)}</p>` : ''}
          ${formData.estado_deuda !== deudaOriginal!.estado_deuda ? 
            `<p><strong>Estado:</strong> ${getEstadoText(deudaOriginal!.estado_deuda)} → ${getEstadoText(formData.estado_deuda)}</p>` : ''}
          ${formData.fecha_vencimiento !== deudaOriginal!.fecha_vencimiento.split('T')[0] ? 
            `<p><strong>Vencimiento:</strong> ${formatFecha(deudaOriginal!.fecha_vencimiento)} → ${formatFecha(formData.fecha_vencimiento)}</p>` : ''}
        </div>
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
      
      if (parseFloat(formData.monto_original) !== parseFloat(deudaOriginal!.monto_original.toString())) {
        dataToSend.monto_original = parseFloat(formData.monto_original);
      }
      if (parseFloat(formData.saldo_pendiente) !== parseFloat(deudaOriginal!.saldo_pendiente.toString())) {
        dataToSend.saldo_pendiente = parseFloat(formData.saldo_pendiente);
      }
      if (formData.descripcion !== deudaOriginal!.descripcion) {
        dataToSend.descripcion = formData.descripcion;
      }
      if (formData.fecha_vencimiento !== deudaOriginal!.fecha_vencimiento.split('T')[0]) {
        dataToSend.fecha_vencimiento = formData.fecha_vencimiento;
      }
      if (formData.estado_deuda !== deudaOriginal!.estado_deuda) {
        dataToSend.estado_deuda = formData.estado_deuda;
      }

      await updateDeuda(id!, dataToSend);

      await Swal.fire({
        icon: 'success',
        title: '¡Deuda actualizada!',
        text: 'Los datos se han actualizado exitosamente',
        confirmButtonColor: '#3085d6'
      });

      navigate('/tenant/deudas');
    } catch (error: any) {
      console.error('Error:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: error.response?.data?.error || 'No se pudo actualizar la deuda',
        confirmButtonColor: '#d33'
      });
    } finally {
      setSaving(false);
    }
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

  if (!deudaOriginal) {
    return (
      <div className="client-udp">
        <div className="alert alert-danger">Deuda no encontrada</div>
      </div>
    );
  }

  return (
    <div className="client-udp">
      <div className="client-udp__container">
        <div className="client-udp__header">
          <h1 className="client-udp__title">Actualizar Deuda</h1>
          <p className="client-udp__description">
            Modifique los campos necesarios para actualizar la información de la deuda.
          </p>
        </div>
        
        <form className="client-udp__form" onSubmit={handleSubmit}>
          <div className="client-udp__form-header">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="client-udp__form-icon" />
            <span>Detalles de la Deuda</span>
          </div>
          
          <div className="client-udp__form-body">
            <div className="client-udp__form-row">
              {/* ID de la Deuda (no editable) */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">ID de Deuda</label>
                <input
                  type="text"
                  className="client-udp__form-control"
                  value={`#${deudaOriginal.id_deuda.substring(0, 8).toUpperCase()}`}
                  disabled
                />
              </div>
              
              {/* Cliente (no editable) */}
              <div className="client-udp__form-group client-udp__form-group--full">
                <label className="client-udp__form-label">Cliente</label>
                <div className="selected-client-info">
                  <div className="client-name">
                    {deudaOriginal.Cliente?.nombre_cliente} {deudaOriginal.Cliente?.apellido_paterno} {deudaOriginal.Cliente?.apellido_materno}
                  </div>
                  <div className="client-phone">
                    {deudaOriginal.Cliente?.email_cliente} - {deudaOriginal.Cliente?.telefono_cliente}
                  </div>
                </div>
              </div>
              
              {/* Fecha de Emisión (no editable) */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Fecha de Emisión</label>
                <input
                  type="text"
                  className="client-udp__form-control"
                  value={formatFecha(deudaOriginal.fecha_emision)}
                  disabled
                />
              </div>
              
              {/* Monto Original */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Monto Original *</label>
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
              
              {/* Saldo Pendiente */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Saldo Pendiente *</label>
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    type="text"
                    className={`client-udp__form-control ${touched.saldo_pendiente && errors.saldo_pendiente ? 'is-invalid' : ''}`}
                    name="saldo_pendiente"
                    value={formData.saldo_pendiente}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
                {touched.saldo_pendiente && errors.saldo_pendiente && (
                  <div className="invalid-feedback">{errors.saldo_pendiente}</div>
                )}
                <small className="form-text text-muted">
                  Monto pagado: {formatMoneda(parseFloat(formData.monto_original) - parseFloat(formData.saldo_pendiente))}
                </small>
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
                  disabled={saving}
                />
                {touched.fecha_vencimiento && errors.fecha_vencimiento && (
                  <div className="invalid-feedback">{errors.fecha_vencimiento}</div>
                )}
              </div>
              
              {/* Estado de la Deuda */}
              <div className="client-udp__form-group">
                <label className="client-udp__form-label">Estado *</label>
                <select
                  className="client-udp__form-control"
                  name="estado_deuda"
                  value={formData.estado_deuda}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={saving}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagada</option>
                  <option value="vencido">Vencida</option>
                </select>
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
                  placeholder="Descripción de la deuda, servicio/producto relacionado..."
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
              disabled={saving || !hasChanges()}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="client-udp__btn-icon" />
                  Actualizar Deuda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateDeuda;