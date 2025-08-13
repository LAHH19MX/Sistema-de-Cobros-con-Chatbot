import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard, faCalendar, faExclamationTriangle, faCheckCircle,
  faEnvelope, faUsers, faTimes, faEdit, faSpinner,
  faArrowUp, faArrowDown, faMinus, faInfoCircle, faClock
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import Swal from 'sweetalert2';
import {
  getSubscriptionStatus,
  getResourceUsage,
  cancelSubscription,
  changePlan,
  type SubscriptionStatusResponse,
  type ResourcesResponse,
  type ChangePlanRequest
} from '../../api/suscripcion';
import { getPlanes, type Plan } from '../../api/plans';
import { useAuth } from '../../context/AuthContext';
import '../../styles/tenant/SubscriptionPage.css';

const SubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados principales
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [resources, setResources] = useState<ResourcesResponse | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  
  // Estados de loading
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [subscriptionRes, resourcesRes, planesRes] = await Promise.all([
          getSubscriptionStatus(),
          getResourceUsage(),
          getPlanes()
        ]);
        
        setSubscription(subscriptionRes);
        setResources(resourcesRes);
        setAvailablePlans(planesRes.planes);
        
      } catch (error) {
        setError('Error al cargar los datos de suscripción');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Función para obtener color según estado del recurso
  const getResourceColor = (status: string) => {
    switch (status) {
      case 'agotado': return '#dc3545';
      case 'critico': return '#fd7e14';
      case 'advertencia': return '#ffc107';
      default: return '#28a745';
    }
  };

  // Función para obtener ícono según estado del recurso
  const getResourceIcon = (status: string) => {
    switch (status) {
      case 'agotado': return faTimes;
      case 'critico': return faExclamationTriangle;
      case 'advertencia': return faExclamationTriangle;
      default: return faCheckCircle;
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para cancelar suscripción
  const handleCancelSubscription = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar suscripción?',
      text: 'Esta acción cancelará tu suscripción. Mantendrás acceso hasta el final de tu período de facturación.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener'
    });

    if (result.isConfirmed) {
      try {
        setCanceling(true);
        const response = await cancelSubscription();
        
        // ✅ CORREGIDO: Recargar datos completos en lugar de actualizar localmente
        const [subscriptionRes, resourcesRes] = await Promise.all([
          getSubscriptionStatus(),
          getResourceUsage()
        ]);
        
        setSubscription(subscriptionRes);
        setResources(resourcesRes);
        
        Swal.fire({
          icon: 'success',
          title: '¡Suscripción cancelada!',
          text: response.subscription?.mensajeAcceso || response.message,
          confirmButtonColor: '#3085d6'
        });
        
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cancelar la suscripción. Inténtalo nuevamente.',
          confirmButtonColor: '#3085d6'
        });
      } finally {
        setCanceling(false);
      }
    }
  };

  // Función para cambiar plan
  const handleChangePlan = async () => {
    if (!selectedPlan || !subscription?.subscription) return;

    try {
      setChangingPlan(true);
      const changePlanData: ChangePlanRequest = {
        planId: selectedPlan,
        gateway: subscription.subscription.pasarela
      };
      
      const response = await changePlan(changePlanData);
      
      // Recargar datos
      const [subscriptionRes, resourcesRes] = await Promise.all([
        getSubscriptionStatus(),
        getResourceUsage()
      ]);
      
      setSubscription(subscriptionRes);
      setResources(resourcesRes);
      setShowChangePlan(false);
      setSelectedPlan(null);
      
      // ✅ CORREGIDO: Mensaje más específico para cambio programado
      Swal.fire({
        icon: 'success',
        title: '¡Cambio programado!',
        html: `<p><strong>${response.message}</strong></p><p>${response.subscription?.mensaje || ''}</p>`,
        confirmButtonColor: '#3085d6'
      });
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo programar el cambio de plan. Inténtalo nuevamente.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setChangingPlan(false);
    }
  };

  // Función para obtener texto de comparación de precios
  const getPriceComparison = (currentPrice: number, newPrice: number) => {
    if (newPrice > currentPrice) {
      return { text: `+$${(newPrice - currentPrice).toFixed(2)}`, icon: faArrowUp, color: '#dc3545' };
    } else if (newPrice < currentPrice) {
      return { text: `-$${(currentPrice - newPrice).toFixed(2)}`, icon: faArrowDown, color: '#28a745' };
    } else {
      return { text: 'Mismo precio', icon: faMinus, color: '#6c757d' };
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

  if (!subscription?.hasSubscription) {
    return (
      <div className="susc">
        <div className="susc__page-header">
          <h1 className="susc__page-title">
            <FontAwesomeIcon icon={faCreditCard} className="susc__title-icon" />
            Gestión de Suscripción
          </h1>
          <p className="susc__page-subtitle">No tienes una suscripción activa</p>
        </div>
        <div className="susc__no-subscription">
          <p>Para acceder a todas las funcionalidades, contrata un plan.</p>
          <button 
            className="susc__btn susc__btn--primary"
            onClick={() => navigate('/tenant/planes')}
          >
            Ver Planes Disponibles
          </button>
        </div>
      </div>
    );
  }

  const sub = subscription.subscription!;
  const currentPlan = availablePlans.find(p => p.id_plan === sub.plan.id);

  return (
    <div className="susc">
      {/* Header de página */}
      <div className="susc__page-header">
        <h1 className="susc__page-title">
          <FontAwesomeIcon icon={faCreditCard} className="susc__title-icon" />
          Gestión de Suscripción
        </h1>
        <p className="susc__page-subtitle">
          Administra tu plan actual y controla el uso de recursos
        </p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Contenido principal */}
      <div className="susc__main-section">
        <div className="susc__content-grid">
          
          {/* Información del Plan Actual */}
          <div className="susc__plan-section">
            <h3 className="susc__section-title">
              <FontAwesomeIcon icon={faCreditCard} className="susc__section-icon" />
              Plan Actual
            </h3>
            
            <div className="susc__plan-card">
              <div className="susc__plan-header">
                <div className="susc__plan-info">
                  <h4 className="susc__plan-name">{sub.plan.nombre}</h4>
                  <p className="susc__plan-price">${sub.plan.precio}/mes</p>
                </div>
                <div className={`susc__plan-status susc__plan-status--${sub.estado}`}>
                  <FontAwesomeIcon 
                    icon={sub.estado === 'activa' ? faCheckCircle : faExclamationTriangle} 
                    className="susc__status-icon" 
                  />
                  {sub.estado === 'activa' ? 'Activa' : 
                   sub.estado === 'cancelada' ? 'Cancelada' : 
                   sub.estado === 'vencida' ? 'Vencida' : 'En período de gracia'}
                </div>
              </div>
              
              <div className="susc__plan-details">
                <div className="susc__detail-item">
                  <FontAwesomeIcon icon={faCalendar} className="susc__detail-icon" />
                  <span className="susc__detail-label">Inicio:</span>
                  <span className="susc__detail-value">{formatDate(sub.fechaInicio)}</span>
                </div>
                <div className="susc__detail-item">
                  <FontAwesomeIcon icon={faCalendar} className="susc__detail-icon" />
                  <span className="susc__detail-label">Renovación:</span>
                  <span className="susc__detail-value">{formatDate(sub.fechaRenovacion)}</span>
                </div>
                <div className="susc__detail-item">
                  <FontAwesomeIcon icon={faInfoCircle} className="susc__detail-icon" />
                  <span className="susc__detail-label">Días restantes:</span>
                  <span className="susc__detail-value">{sub.diasRestantes} días</span>
                </div>
              </div>
              
              <p className="susc__plan-message">{sub.mensaje}</p>
              
              {/* ✅ AGREGADO: Mostrar plan siguiente si existe */}
              {sub.planSiguiente && (
                <div className="susc__next-plan-info">
                  <div className="susc__next-plan-header">
                    <FontAwesomeIcon icon={faClock} className="susc__next-plan-icon" />
                    <span className="susc__next-plan-title">Cambio Programado</span>
                  </div>
                  <div className="susc__next-plan-details">
                    <p className="susc__next-plan-text">
                      <strong>{sub.planSiguiente.nombre}</strong> - ${sub.planSiguiente.precio}/mes
                    </p>
                    <p className="susc__next-plan-date">
                      {sub.planSiguiente.mensaje}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Uso de Recursos */}
          <div className="susc__resources-section">
            <h3 className="susc__section-title">
              <FontAwesomeIcon icon={faUsers} className="susc__section-icon" />
              Uso de Recursos
            </h3>
            
            {resources?.recursos && (
              <div className="susc__resources-grid">
                {/* WhatsApp */}
                <div className="susc__resource-card">
                  <div className="susc__resource-header">
                    <FontAwesomeIcon icon={faWhatsapp} className="susc__resource-icon susc__resource-icon--whatsapp" />
                    <div className="susc__resource-info">
                      <h5 className="susc__resource-name">WhatsApp</h5>
                      <p className="susc__resource-desc">{resources.recursos.whatsapp.descripcion}</p>
                    </div>
                    <FontAwesomeIcon 
                      icon={getResourceIcon(resources.recursos.whatsapp.status)}
                      className="susc__resource-status-icon"
                      style={{ color: getResourceColor(resources.recursos.whatsapp.status) }}
                    />
                  </div>
                  <div className="susc__resource-usage">
                    <div className="susc__usage-numbers">
                      <span className="susc__usage-current">{resources.recursos.whatsapp.usado}</span>
                      <span className="susc__usage-separator">/</span>
                      <span className="susc__usage-limit">{resources.recursos.whatsapp.limite}</span>
                    </div>
                    <div className="susc__progress-bar">
                      <div 
                        className="susc__progress-fill"
                        style={{ 
                          width: `${Math.min(resources.recursos.whatsapp.porcentaje, 100)}%`,
                          backgroundColor: getResourceColor(resources.recursos.whatsapp.status)
                        }}
                      ></div>
                    </div>
                    <div className="susc__usage-percentage">
                      {resources.recursos.whatsapp.porcentaje}%
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="susc__resource-card">
                  <div className="susc__resource-header">
                    <FontAwesomeIcon icon={faEnvelope} className="susc__resource-icon susc__resource-icon--email" />
                    <div className="susc__resource-info">
                      <h5 className="susc__resource-name">Email</h5>
                      <p className="susc__resource-desc">{resources.recursos.email.descripcion}</p>
                    </div>
                    <FontAwesomeIcon 
                      icon={getResourceIcon(resources.recursos.email.status)}
                      className="susc__resource-status-icon"
                      style={{ color: getResourceColor(resources.recursos.email.status) }}
                    />
                  </div>
                  <div className="susc__resource-usage">
                    <div className="susc__usage-numbers">
                      <span className="susc__usage-current">{resources.recursos.email.usado}</span>
                      <span className="susc__usage-separator">/</span>
                      <span className="susc__usage-limit">{resources.recursos.email.limite}</span>
                    </div>
                    <div className="susc__progress-bar">
                      <div 
                        className="susc__progress-fill"
                        style={{ 
                          width: `${Math.min(resources.recursos.email.porcentaje, 100)}%`,
                          backgroundColor: getResourceColor(resources.recursos.email.status)
                        }}
                      ></div>
                    </div>
                    <div className="susc__usage-percentage">
                      {resources.recursos.email.porcentaje}%
                    </div>
                  </div>
                </div>

                {/* Clientes */}
                <div className="susc__resource-card">
                  <div className="susc__resource-header">
                    <FontAwesomeIcon icon={faUsers} className="susc__resource-icon susc__resource-icon--clients" />
                    <div className="susc__resource-info">
                      <h5 className="susc__resource-name">Clientes</h5>
                      <p className="susc__resource-desc">{resources.recursos.clientes.descripcion}</p>
                    </div>
                    <FontAwesomeIcon 
                      icon={getResourceIcon(resources.recursos.clientes.status)}
                      className="susc__resource-status-icon"
                      style={{ color: getResourceColor(resources.recursos.clientes.status) }}
                    />
                  </div>
                  <div className="susc__resource-usage">
                    <div className="susc__usage-numbers">
                      <span className="susc__usage-current">{resources.recursos.clientes.usado}</span>
                      <span className="susc__usage-separator">/</span>
                      <span className="susc__usage-limit">{resources.recursos.clientes.limite}</span>
                    </div>
                    <div className="susc__progress-bar">
                      <div 
                        className="susc__progress-fill"
                        style={{ 
                          width: `${Math.min(resources.recursos.clientes.porcentaje, 100)}%`,
                          backgroundColor: getResourceColor(resources.recursos.clientes.status)
                        }}
                      ></div>
                    </div>
                    <div className="susc__usage-percentage">
                      {resources.recursos.clientes.porcentaje}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {resources?.resumen && (
              <div className={`susc__resources-summary susc__resources-summary--${resources.resumen.estado}`}>
                <FontAwesomeIcon 
                  icon={resources.resumen.estado === 'bueno' ? faCheckCircle : faExclamationTriangle}
                  className="susc__summary-icon"
                />
                <span className="susc__summary-text">{resources.resumen.mensaje}</span>
              </div>
            )}
          </div>

          {/* Acciones de Suscripción */}
          <div className="susc__actions-section">
            <h3 className="susc__section-title">
              <FontAwesomeIcon icon={faEdit} className="susc__section-icon" />
              Acciones
            </h3>
            
            <div className="susc__actions-grid">
              {sub.estado === 'activa' && (
                <>
                  <button 
                    className="susc__action-btn susc__action-btn--primary"
                    onClick={() => setShowChangePlan(!showChangePlan)}
                  >
                    <FontAwesomeIcon icon={faEdit} className="susc__action-icon" />
                    {sub.planSiguiente ? 'Cambiar Plan Programado' : 'Cambiar Plan'}
                  </button>
                  
                  <button 
                    className="susc__action-btn susc__action-btn--danger"
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                  >
                    {canceling ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="susc__action-icon fa-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTimes} className="susc__action-icon" />
                        Cancelar Suscripción
                      </>
                    )}
                  </button>
                </>
              )}
              
              {sub.estado === 'cancelada' && (
                <div className="susc__canceled-info">
                  <FontAwesomeIcon icon={faInfoCircle} className="susc__info-icon" />
                  <p>Tu suscripción está cancelada. Mantienes acceso hasta el {formatDate(sub.fechaRenovacion)}.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Cambio de Plan */}
        {showChangePlan && sub.estado === 'activa' && (
          <div className="susc__change-plan-section">
            <h3 className="susc__section-title">
              <FontAwesomeIcon icon={faEdit} className="susc__section-icon" />
              {sub.planSiguiente ? 'Modificar Cambio de Plan' : 'Cambiar Plan'}
            </h3>
            
            {/* ✅ AGREGADO: Información sobre cambio programado */}
            <div className="susc__change-plan-info">
              <div className="alert alert-info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                <strong>Importante:</strong> El cambio de plan se aplicará en tu próxima renovación 
                ({formatDate(sub.fechaRenovacion)}). Tu plan actual continuará hasta esa fecha.
              </div>
            </div>
            
            <div className="susc__plans-grid">
              {availablePlans.map((plan) => {
                const isCurrentPlan = plan.id_plan === sub.plan.id;
                const isNextPlan = sub.planSiguiente?.id === plan.id_plan;
                const priceComparison = isCurrentPlan ? null : getPriceComparison(sub.plan.precio, plan.precio_plan);
                
                return (
                  <div 
                    key={plan.id_plan}
                    className={`susc__plan-option 
                      ${isCurrentPlan ? 'susc__plan-option--current' : ''} 
                      ${isNextPlan ? 'susc__plan-option--next' : ''}
                      ${selectedPlan === plan.id_plan ? 'susc__plan-option--selected' : ''}`}
                    onClick={() => !isCurrentPlan && setSelectedPlan(plan.id_plan)}
                  >
                    <div className="susc__plan-option-header">
                      <h4 className="susc__plan-option-name">{plan.nombre_plan}</h4>
                      <div className="susc__plan-option-price">
                        <span className="susc__price-amount">${plan.precio_plan}</span>
                        <span className="susc__price-period">/mes</span>
                      </div>
                    </div>
                    
                    {plan.descripcion_plan && (
                      <p className="susc__plan-option-desc">{plan.descripcion_plan}</p>
                    )}
                    
                    <div className="susc__plan-option-features">
                      <div className="susc__feature">
                        <FontAwesomeIcon icon={faWhatsapp} className="susc__feature-icon" />
                        {plan.limites_whatsapp} mensajes WhatsApp
                      </div>
                      <div className="susc__feature">
                        <FontAwesomeIcon icon={faEnvelope} className="susc__feature-icon" />
                        {plan.limites_email} emails
                      </div>
                      <div className="susc__feature">
                        <FontAwesomeIcon icon={faUsers} className="susc__feature-icon" />
                        {plan.limites_clientes || 'Ilimitados'} clientes
                      </div>
                    </div>
                    
                    {isCurrentPlan && (
                      <div className="susc__current-plan-badge">Plan Actual</div>
                    )}
                    
                    {/* ✅ AGREGADO: Badge para plan siguiente */}
                    {isNextPlan && (
                      <div className="susc__next-plan-badge">Plan Programado</div>
                    )}
                    
                    {priceComparison && (
                      <div className="susc__price-comparison" style={{ color: priceComparison.color }}>
                        <FontAwesomeIcon icon={priceComparison.icon} />
                        {priceComparison.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="susc__change-plan-actions">
              <button 
                className="susc__btn susc__btn--cancel"
                onClick={() => {
                  setShowChangePlan(false);
                  setSelectedPlan(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="susc__btn susc__btn--primary"
                onClick={handleChangePlan}
                disabled={!selectedPlan || changingPlan}
              >
                {changingPlan ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="susc__btn-icon fa-spin" />
                    Programando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faClock} className="susc__btn-icon" />
                    {sub.planSiguiente ? 'Cambiar Plan Programado' : 'Programar Cambio'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;