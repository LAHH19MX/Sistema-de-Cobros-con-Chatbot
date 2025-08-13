import { useState, useEffect } from 'react';
import { getPlanes } from '../../api/plans';
import type { Plan } from '../../api/plans';
import Spinner from '../../components/ui/Spinner';
import '../../styles/site/PreciosPage.css';

const PreciosPage = () => {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubscribe = () => {
    // Para invitados: siempre redirigir a registro
    window.location.href = '/register';
  };

  // Función para formatear el precio
  const formatPrice = (price: number) => {
    return price.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).replace('MX$', '');
  };

  // Función para obtener los beneficios del plan
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchPlanes}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (planes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No hay planes disponibles</h2>
            <p className="text-gray-600 mb-6">Por el momento no hay planes de suscripción disponibles.</p>
            <button 
              onClick={fetchPlanes}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="section--plans">
      <div className="container">
        <h2 className="section__title">Elige tu Plan Ideal</h2>
        <p className="section__subtitle">Encuentra el plan perfecto para hacer crecer tu negocio</p>
        
        <div className="section--plans__grid">
          {planes.map((plan) => (
            <div key={plan.id_plan} className="plan-card relative">
              <div className="plan-card__header">
                <h3 className="plan-card__name">{plan.nombre_plan}</h3>
                <p className="plan-card__tag">
                  {plan.nombre_plan.includes('Básico') && 'Perfecto para empezar'}
                  {plan.nombre_plan.includes('Pro') && 'Para crecer rápido'}
                  {plan.nombre_plan.includes('Enterprise') && 'Máxima potencia'}
                  {plan.nombre_plan.includes('Élite') && 'Todo sin límites'}
                </p>
              </div>
              
              <div className="plan-card__body">
                <div className="plan-card__price">
                  <span className="plan-card__currency">$</span>
                  {formatPrice(plan.precio_plan)}
                  <span className="plan-card__decimals">/mes</span>
                </div>
                
                <ul className="plan-card__benefits">
                  {getPlanBenefits(plan).map((benefit, index) => (
                    <li key={index} className="plan-card__benefit">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="plan-card__footer">
                <button 
                  className="plan-card__cta"
                  onClick={handleSubscribe}
                >
                  Empezar ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PreciosPage;