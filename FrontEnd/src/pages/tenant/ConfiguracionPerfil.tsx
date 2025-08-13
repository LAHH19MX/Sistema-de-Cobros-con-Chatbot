import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, faEye, faEyeSlash, faSave, faCog, faSyncAlt,
  faCreditCard, faMoneyBill, faClock, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { 
  getConfiguracion, 
  updateConfiguracion,
  getPasarelas,
  upsertPasarela,
  updateEstadoPasarela,
} from '../../api/settingsTenant';
import { useAuth } from '../../context/AuthContext';
import type { ConfiguracionMensajes, Pasarela } from '../../api/settingsTenant';
import '../../styles/tenant/ConfiguracionPage.css';

const ConfiguracionPage = () => {
  const { signin, isAuthenticated, user } = useAuth();

  const navigate = useNavigate();
  const inquilinoId = user?.id;

  // Estados para la configuración
  const [config, setConfig] = useState<ConfiguracionMensajes | null>(null);
  const [pasarelas, setPasarelas] = useState<Pasarela[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para visibilidad de contraseñas
  const [showStripePublic, setShowStripePublic] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showStripeWebhook, setShowStripeWebhook] = useState(false);
  const [showPaypalClient, setShowPaypalClient] = useState(false);
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);
  const [showPaypalWebhook, setShowPaypalWebhook] = useState(false);
  
  // Estados para datos editables
  const [stripeData, setStripeData] = useState({
    credenciales_api: '',
    client_secret: '',
    webhook_secret: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });
  
  const [paypalData, setPaypalData] = useState({
    credenciales_api: '',
    client_secret: '',
    webhook_id: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });

  // Función para abrir la guía de webhooks
  const abrirGuiaWebhooks = () => {
    navigate(`/tenant/guia-webhooks/${inquilinoId}`);
  };

  // Opciones de frecuencia
  const frecuenciaOpciones = [
    { label: '1 día', value: 24 },
    { label: '3 días', value: 72 },
    { label: '5 días', value: 120 },
    { label: '1 semana', value: 168 },
    { label: '2 semanas', value: 336 },
    { label: '1 mes', value: 720 }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [configRes, pasarelasRes] = await Promise.all([
          getConfiguracion(),
          getPasarelas()
        ]);
        
        setConfig(configRes.data);
        setPasarelas(pasarelasRes.data);
        
        // Separar datos de pasarelas
        const stripe = pasarelasRes.data.find(p => p.pasarela === 'stripe');
        const paypal = pasarelasRes.data.find(p => p.pasarela === 'paypal');
        
        if (stripe) {
          setStripeData({
            credenciales_api: stripe.credenciales_api,
            client_secret: stripe.client_secret || '',
            webhook_secret: stripe.webhook_secret || '',
            estado: stripe.estado
          });
        }
        
        if (paypal) {
          setPaypalData({
            credenciales_api: paypal.credenciales_api,
            client_secret: paypal.client_secret || '',
            webhook_id: paypal.webhook_id || '',
            estado: paypal.estado
          });
        }
        
      } catch (error) {
        setError("Error al cargar la configuración");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Función para alternar visibilidad de contraseñas
  const toggleVisibilidad = (campo: string) => {
    switch(campo) {
      case 'stripePublic': setShowStripePublic(!showStripePublic); break;
      case 'stripeSecret': setShowStripeSecret(!showStripeSecret); break;
      case 'stripeWebhook': setShowStripeWebhook(!showStripeWebhook); break;
      case 'paypalClient': setShowPaypalClient(!showPaypalClient); break;
      case 'paypalSecret': setShowPaypalSecret(!showPaypalSecret); break;
      case 'paypalWebhook': setShowPaypalWebhook(!showPaypalWebhook); break;
    }
  };

  // Guardar configuración de mensajes
  const handleGuardarMensajes = async () => {
    if (!config) return;
    
    try {
      setSavingConfig(true);
      const response = await updateConfiguracion({
        motivo: config.motivo,
        mensaje_pre_vencimiento: config.mensaje_pre_vencimiento,
        mensaje_post_vencimiento: config.mensaje_post_vencimiento,
        frecuencia: config.frecuencia
      });
      
      setConfig(response.data.configuracion);
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Configuración guardada!',
        text: 'La configuración de mensajes se ha guardado exitosamente',
        confirmButtonColor: '#3085d6',
      });
    } catch (error) {
      setError('Error al guardar la configuración');
    } finally {
      setSavingConfig(false);
    }
  };

  // Guardar configuración de Stripe
  const handleGuardarStripe = async () => {
    try {
      setSavingStripe(true);
      const response = await upsertPasarela({
        pasarela: 'stripe',
        credenciales_api: stripeData.credenciales_api,
        client_secret: stripeData.client_secret,
        webhook_secret: stripeData.webhook_secret
      });
      
      // Actualizar estado local
      setPasarelas(prev => [
        ...prev.filter(p => p.pasarela !== 'stripe'),
        response.data.pasarela
      ]);
      
      setStripeData({
        ...stripeData,
        credenciales_api: response.data.pasarela.credenciales_api,
        client_secret: response.data.pasarela.client_secret || '',
        webhook_secret: response.data.pasarela.webhook_secret || ''
      });
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Stripe guardado!',
        text: 'La configuración de Stripe se ha guardado exitosamente',
        confirmButtonColor: '#3085d6',
      });
    } catch (error) {
      setError('Error al guardar Stripe');
    } finally {
      setSavingStripe(false);
    }
  };

  // Guardar configuración de PayPal
  const handleGuardarPaypal = async () => {
    try {
      setSavingPaypal(true);
      const response = await upsertPasarela({
        pasarela: 'paypal',
        credenciales_api: paypalData.credenciales_api,
        client_secret: paypalData.client_secret,
        webhook_id: paypalData.webhook_id
      });
      
      // Actualizar estado local
      setPasarelas(prev => [
        ...prev.filter(p => p.pasarela !== 'paypal'),
        response.data.pasarela
      ]);
      
      setPaypalData({
        ...paypalData,
        credenciales_api: response.data.pasarela.credenciales_api,
        client_secret: response.data.pasarela.client_secret || '',
        webhook_id: response.data.pasarela.webhook_id || ''
      });
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: '¡PayPal guardado!',
        text: 'La configuración de PayPal se ha guardado exitosamente',
        confirmButtonColor: '#3085d6',
      });
    } catch (error) {
      setError('Error al guardar PayPal');
    } finally {
      setSavingPaypal(false);
    }
  };

  // Cambiar estado de pasarela
  const handleCambiarEstado = async (tipo: 'stripe' | 'paypal', estado: 'ACTIVO' | 'INACTIVO') => {
    try {
      await updateEstadoPasarela(tipo, { estado });
      
      // Actualizar estado local
      if (tipo === 'stripe') {
        setStripeData(prev => ({ ...prev, estado }));
      } else {
        setPaypalData(prev => ({ ...prev, estado }));
      }
      
      // Actualizar lista de pasarelas
      setPasarelas(prev => 
        prev.map(p => p.pasarela === tipo ? { ...p, estado } : p)
      );
      
    } catch (error) {
      setError(`Error al actualizar estado de ${tipo}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return <div>No se pudo cargar la configuración</div>;
  }

  return (
    <div className="client-config">
      {/* Header de página */}
      <div className="client-config__page-header">
        <h1 className="client-config__page-title">
          <FontAwesomeIcon icon={faCog} className="client-config__title-icon" />
          Configuración
        </h1>
        <p className="client-config__page-subtitle">
          Administra las configuraciones de tu sistema de cobros
        </p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Contenido principal */}
      <div className="client-config__main-section">
        <div className="client-config__config-grid">
          {/* Sección de Correos Electrónicos */}
          <div className="client-config__config-section client-config__config-section--full-width">
            <h3 className="client-config__section-title">
              <FontAwesomeIcon icon={faEnvelope} className="client-config__section-icon" />
              Configuración de Correos Automáticos
            </h3>

            {/* Título y frecuencia en misma línea */}
            <div className="client-config__form-row">
              <div className="client-config__form-group client-config__form-group--half">
                <label className="client-config__form-label">Título del Correo</label>
                <input 
                  type="text" 
                  className="client-config__form-control" 
                  placeholder="Ej: Recordatorio de Pago - [Nombre de tu empresa]" 
                  value={config.motivo}
                  onChange={(e) => setConfig({ ...config, motivo: e.target.value })}
                />
                <small className="client-config__form-text">Este título aparecerá en el asunto de todos los correos automáticos</small>
              </div>

              <div className="client-config__form-group client-config__form-group--half">
                <label className="client-config__form-label">
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  Frecuencia de envío
                </label>
                <select 
                  className="client-config__form-control"
                  value={config.frecuencia}
                  onChange={(e) => setConfig({ ...config, frecuencia: Number(e.target.value) })}
                >
                  {frecuenciaOpciones.map(opcion => (
                    <option key={opcion.value} value={opcion.value}>
                      Cada {opcion.label}
                    </option>
                  ))}
                </select>
                <small className="client-config__form-text">
                  Los mensajes se enviarán automáticamente según esta frecuencia
                </small>
              </div>
            </div>
            
            <div className="client-config__messages-container">
              <div className="client-config__message-box">
                <div className="client-config__form-group">
                  <label className="client-config__form-label">Mensaje Pre-vencimiento</label>
                  <textarea 
                    className="client-config__form-control" 
                    rows={6}
                    value={config.mensaje_pre_vencimiento}
                    onChange={(e) => setConfig({ ...config, mensaje_pre_vencimiento: e.target.value })}
                  ></textarea>
                  <small className="client-config__form-text">Se enviará antes de la fecha de vencimiento</small>
                </div>
              </div>
              
              <div className="client-config__message-box">
                <div className="client-config__form-group">
                  <label className="client-config__form-label">Mensaje Post-vencimiento</label>
                  <textarea 
                    className="client-config__form-control" 
                    rows={6}
                    value={config.mensaje_post_vencimiento}
                    onChange={(e) => setConfig({ ...config, mensaje_post_vencimiento: e.target.value })}
                  ></textarea>
                  <small className="client-config__form-text">Se enviará después de la fecha de vencimiento</small>
                </div>
              </div>
            </div>

            {/* Botones para correos */}
            <div className="client-config__form-actions">
              <button className="client-config__btn client-config__btn--cancel">Cancelar</button>
              <button 
                className="client-config__btn client-config__btn--primary"
                onClick={handleGuardarMensajes}
                disabled={savingConfig}
              >
                {savingConfig ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="client-config__btn-icon" />
                    Guardar Mensajes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sección de Stripe */}
          <div className="client-config__config-section">
            <h3 className="client-config__section-title">
              <FontAwesomeIcon icon={faCreditCard} className="client-config__section-icon" />
              Stripe
            </h3>

            <div className="client-config__form-group">
              <label className="client-config__form-label">API Key</label>
              <div className="client-config__input-group">
                <input 
                  type={showStripePublic ? "text" : "password"}
                  className="client-config__form-control" 
                  placeholder="sk_test_... o sk_live_..." 
                  value={stripeData.credenciales_api}
                  onChange={(e) => setStripeData({ ...stripeData, credenciales_api: e.target.value })}
                />
                <button 
                  className="client-config__btn-toggle-visibility" 
                  type="button"
                  onClick={() => toggleVisibilidad('stripePublic')}
                >
                  <FontAwesomeIcon icon={showStripePublic ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Campo Secret con leyenda opcional */}
            <div className="client-config__form-group">
              <label className="client-config__form-label">
                Secret (Opcional)
                <FontAwesomeIcon 
                  icon={faInfoCircle} 
                  className="ms-2 text-info" 
                  title="Campo opcional para configuraciones específicas"
                />
              </label>
              <div className="client-config__input-group">
                <input 
                  type={showStripeSecret ? "text" : "password"}
                  className="client-config__form-control" 
                  placeholder="whsec_..." 
                  value={stripeData.client_secret}
                  onChange={(e) => setStripeData({ ...stripeData, client_secret: e.target.value })}
                />
                <button 
                  className="client-config__btn-toggle-visibility" 
                  type="button"
                  onClick={() => toggleVisibilidad('stripeSecret')}
                >
                  <FontAwesomeIcon icon={showStripeSecret ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="client-config__form-group">
              <label className="client-config__form-label">
                Webhook Secret 
                <FontAwesomeIcon 
                  icon={faInfoCircle} 
                  className="ms-2 text-info" 
                  title="Obténlo al configurar el webhook en Stripe Dashboard"
                />
              </label>
              <div className="client-config__input-group">
                <input 
                  type={showStripeWebhook ? "text" : "password"}
                  className="client-config__form-control" 
                  placeholder="whsec_..." 
                  value={stripeData.webhook_secret}
                  onChange={(e) => setStripeData({ ...stripeData, webhook_secret: e.target.value })}
                />
                <button 
                  className="client-config__btn-toggle-visibility" 
                  type="button"
                  onClick={() => toggleVisibilidad('stripeWebhook')}
                >
                  <FontAwesomeIcon icon={showStripeWebhook ? faEyeSlash : faEye} />
                </button>
              </div>
              {/* Mensaje de configuración con navegación */}
              <small className="client-config__form-text">
                Para configurar sus credenciales ingrese a nuestro apartado de integraciones.
                <button 
                  className="client-config__btn client-config__btn--link ms-1"
                  onClick={abrirGuiaWebhooks}
                >
                  Configurar
                </button>
              </small>
            </div>

            {/* Activación y actualización */}
            <div className="client-config__activation-container">
              <div className="client-config__form-check">
                <input 
                  type="checkbox" 
                  className="client-config__form-check-input" 
                  id="stripeStatus" 
                  checked={stripeData.estado === 'ACTIVO'}
                  onChange={(e) => handleCambiarEstado('stripe', e.target.checked ? 'ACTIVO' : 'INACTIVO')}
                />
              </div>
              <div className="client-config__activation-label">Activar Stripe</div>
            </div>
            
            <div className="client-config__update-info">
              <div className="client-config__status-info">
                <span className="client-config__status-label">
                  <FontAwesomeIcon icon={faSyncAlt} className="client-config__status-icon" />
                  Última actualización:
                </span>
                <span className="client-config__status-value">
                  {pasarelas.find(p => p.pasarela === 'stripe')?.fecha_actualizacion || 'Nunca'}
                </span>
              </div>
            </div>
            
            {/* Botones para pasarelas */}
            <div className="client-config__gateway-actions">
              <button 
                className="client-config__btn client-config__btn--primary"
                onClick={handleGuardarStripe}
                disabled={savingStripe}
              >
                {savingStripe ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="client-config__btn-icon" />
                    Guardar Stripe
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sección de PayPal */}
          <div className="client-config__config-section">
            <h3 className="client-config__section-title">
              <FontAwesomeIcon icon={faMoneyBill} className="client-config__section-icon" />
              PayPal
            </h3>

            <div className="client-config__form-group">
              <label className="client-config__form-label">Client ID</label>
              <div className="client-config__input-group">
                <input 
                  type={showPaypalClient ? "text" : "password"}
                  className="client-config__form-control" 
                  placeholder="AYSq3RDGsmBLJE..." 
                  value={paypalData.credenciales_api}
                  onChange={(e) => setPaypalData({ ...paypalData, credenciales_api: e.target.value })}
                />
                <button 
                  className="client-config__btn-toggle-visibility" 
                  type="button"
                  onClick={() => toggleVisibilidad('paypalClient')}
                >
                  <FontAwesomeIcon icon={showPaypalClient ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="client-config__form-group">
              <label className="client-config__form-label">Secret</label>
              <div className="client-config__input-group">
                <input 
                  type={showPaypalSecret ? "text" : "password"}
                  className="client-config__form-control" 
                  placeholder="EGnHDxD_qRPdaLdZz8..." 
                  value={paypalData.client_secret}
                  onChange={(e) => setPaypalData({ ...paypalData, client_secret: e.target.value })}
                />
                <button 
                  className="client-config__btn-toggle-visibility" 
                  type="button"
                  onClick={() => toggleVisibilidad('paypalSecret')}
                >
                  <FontAwesomeIcon icon={showPaypalSecret ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="client-config__form-group">
              <label className="client-config__form-label">
                Webhook ID
                <FontAwesomeIcon 
                  icon={faInfoCircle} 
                  className="ms-2 text-info" 
                  title="Obténlo al configurar el webhook en PayPal Developer"
                />
              </label>
              <div className="client-config__input-group">
                <input 
                  type={showPaypalWebhook ? "text" : "password"}
                  className="client-config__form-control" 
                  placeholder="WH-..." 
                  value={paypalData.webhook_id}
                  onChange={(e) => setPaypalData({ ...paypalData, webhook_id: e.target.value })}
                />
                <button 
                  className="client-config__btn-toggle-visibility" 
                  type="button"
                  onClick={() => toggleVisibilidad('paypalWebhook')}
                >
                  <FontAwesomeIcon icon={showPaypalWebhook ? faEyeSlash : faEye} />
                </button>
              </div>
              {/* Mensaje de configuración con navegación */}
              <small className="client-config__form-text">
                Para configurar sus credenciales ingrese a nuestro apartado de integraciones.
                <button 
                  className="client-config__btn client-config__btn--link ms-1"
                  onClick={abrirGuiaWebhooks}
                >
                  Configurar
                </button>
              </small>
            </div>

            {/* Activación y actualización */}
            <div className="client-config__activation-container">
              <div className="client-config__form-check">
                <input 
                  type="checkbox" 
                  className="client-config__form-check-input" 
                  id="paypalStatus" 
                  checked={paypalData.estado === 'ACTIVO'}
                  onChange={(e) => handleCambiarEstado('paypal', e.target.checked ? 'ACTIVO' : 'INACTIVO')}
                />
              </div>
              <div className="client-config__activation-label">Activar PayPal</div>
            </div>
            
            <div className="client-config__update-info">
              <div className="client-config__status-info">
                <span className="client-config__status-label">
                  <FontAwesomeIcon icon={faSyncAlt} className="client-config__status-icon" />
                  Última actualización:
                </span>
                <span className="client-config__status-value">
                  {pasarelas.find(p => p.pasarela === 'paypal')?.fecha_actualizacion || 'Nunca'}
                </span>
              </div>
            </div>
            
            {/* Botones para pasarelas */}
            <div className="client-config__gateway-actions">
              <button 
                className="client-config__btn client-config__btn--primary"
                onClick={handleGuardarPaypal}
                disabled={savingPaypal}
              >
                {savingPaypal ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="client-config__btn-icon" />
                    Guardar PayPal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;