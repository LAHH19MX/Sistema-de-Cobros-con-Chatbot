import React, { useState, useEffect } from 'react';
import { getPlanes, createCheckout } from '../../api/plans';
import type { Plan } from '../../api/plans';
import Spinner from '../../components/ui/Spinner';
import '../../styles/tenant/PlanesPage.css';
import Swal from 'sweetalert2';

const PlanesPage: React.FC = () => {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanes();
  }, []);

  const fetchPlanes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlanes();

      if (data.success) {
        setPlanes(data.planes);
      } else {
        setError('Error al cargar los planes');
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu internet.');
      console.error('Error fetching planes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, gateway: 'stripe' | 'paypal') => {
    try {
      setSubscribing(planId);
      
      const data = await createCheckout({ planId, gateway });

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error en el pago',
          text: data.message || 'Ocurrió un error al procesar tu suscripción',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (err: any) {
      console.error('Error creating checkout:', err);
      
      if (err.response?.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión requerida',
          text: 'Debes iniciar sesión para suscribirte',
          confirmButtonText: 'Iniciar sesión',
          confirmButtonColor: '#3085d6',
        });
      } else if (err.response?.status === 400) {
        Swal.fire({
          icon: 'info',
          title: 'Suscripción activa',
          text: err.response.data.message || 'Ya tienes una suscripción activa',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar al servidor. Inténtalo nuevamente.',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#3085d6',
        });
      }
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).replace('MX$', '');
  };

  const getPlanBenefits = (plan: Plan) => {
    const baseBenefits = [
      `${plan.limites_whatsapp} WhatsApp incluidos`,
      `${plan.limites_email} Emails incluidos`,
      plan.limites_api ? 'Acceso a API' : 'Sin acceso a API'
    ];

    if (plan.limites_clientes) {
      baseBenefits.push(`Máx. ${plan.limites_clientes} clientes`);
    } else {
      baseBenefits.push('Clientes ilimitados');
    }

    return baseBenefits;
  };

  const getPlanTag = (planName: string) => {
    if (planName.includes('Básico')) return 'Perfecto para empezar';
    if (planName.includes('Pro')) return 'Para crecer rápido';
    if (planName.includes('Premium')) return 'Máxima potencia';
    if (planName.includes('Élite')) return 'Todo sin límites';
    return 'Solución ideal';
  };

  if (loading) {
    return (
      <div className="plans-tenant plans-tenant--loading">
        <div className="plans-tenant__spinner-container">
          <Spinner />
          <p className="plans-tenant__loading-text">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plans-tenant plans-tenant--error">
        <div className="plans-tenant__error-container">
          <svg className="plans-tenant__error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="plans-tenant__error-title">Error</h2>
          <p className="plans-tenant__error-message">{error}</p>
          <button 
            onClick={fetchPlanes}
            className="plans-tenant__retry-button"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (planes.length === 0) {
    return (
      <div className="plans-tenant plans-tenant--empty">
        <div className="plans-tenant__empty-container">
          <svg className="plans-tenant__empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="plans-tenant__empty-title">No hay planes disponibles</h2>
          <p className="plans-tenant__empty-message">Por el momento no hay planes de suscripción disponibles.</p>
          <button 
            onClick={fetchPlanes}
            className="plans-tenant__update-button"
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="plans-tenant">
      <div className="plans-tenant__container">
        <div className="plans-tenant__header">
          <h2 className="plans-tenant__title">Elige tu Plan Ideal</h2>
          <p className="plans-tenant__subtitle">Encuentra el plan perfecto para hacer crecer tu negocio</p>
        </div>

        <div className="plans-tenant__grid">
          {planes.map((plan) => (
            <div key={plan.id_plan} className="plans-tenant__card">
              <div className="plans-tenant__card-header">
                <h3 className="plans-tenant__card-name">{plan.nombre_plan}</h3>
                <p className="plans-tenant__card-tag">
                  {getPlanTag(plan.nombre_plan)}
                </p>
              </div>
              
              <div className="plans-tenant__card-body">
                <div className="plans-tenant__card-price">
                  <span className="plans-tenant__card-currency">$</span>
                  {formatPrice(plan.precio_plan)}
                  <span className="plans-tenant__card-period">/mes</span>
                </div>
                
                <ul className="plans-tenant__card-benefits">
                  {getPlanBenefits(plan).map((benefit, index) => (
                    <li key={index} className="plans-tenant__card-benefit">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="plans-tenant__card-footer">
                <button 
                  className="plans-tenant__card-button"
                  onClick={() => handleSubscribe(plan.id_plan, 'stripe')}
                  disabled={subscribing === plan.id_plan}
                >
                  {subscribing === plan.id_plan ? 'Procesando...' : 'Empezar ahora'}
                </button>
              </div>
              
              {subscribing === plan.id_plan && (
                <div className="plans-tenant__card-overlay">
                  <Spinner />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlanesPage;