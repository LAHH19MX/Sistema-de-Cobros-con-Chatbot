import React from 'react';
import type { Plan } from '../../api/plans';
import { useAuth } from '../../context/AuthContext';
import '../../styles/tenant/PlanCard.css'

interface PlanCardProps {
  plan: Plan;
  onSubscribe: (planId: string, gateway: 'stripe' | 'paypal') => void;
  isPopular?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSubscribe, isPopular = false }) => {
  const { isAuthenticated } = useAuth();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const hasStripe = !!plan.stripe_price_id;
  const hasPayPal = !!plan.paypal_plan_id;

  // Si no está autenticado, mostrar botón de registro
  const handleGuestClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/register';
      return;
    }
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 ${isPopular ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Badge Popular */}
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-full">
            Más Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {plan.nombre_plan}
        </h3>
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {formatPrice(plan.precio_plan)}
          <span className="text-lg font-normal text-gray-500">/mes</span>
        </div>
        {plan.descripcion_plan && (
          <p className="text-gray-600">{plan.descripcion_plan}</p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            {plan.limites_whatsapp.toLocaleString()} mensajes WhatsApp
          </span>
        </div>

        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            {plan.limites_email.toLocaleString()} emails mensuales
          </span>
        </div>

        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            {plan.limites_clientes 
              ? `${plan.limites_clientes.toLocaleString()} clientes` 
              : 'Clientes ilimitados'
            }
          </span>
        </div>

        <div className="flex items-center">
          {plan.limites_api ? (
            <>
              <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Acceso completo a API</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-gray-500">Sin acceso a API</span>
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        {!isAuthenticated ? (
          // Para invitados: botón único de registro
          <button
            onClick={handleGuestClick}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            Empezar con este plan
          </button>
        ) : (
          // Para usuarios autenticados: botones de pasarelas
          <>
            {hasStripe && (
              <button
                onClick={() => onSubscribe(plan.id_plan, 'stripe')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
                Pagar con Stripe
              </button>
            )}

            {hasPayPal && (
              <button
                onClick={() => onSubscribe(plan.id_plan, 'paypal')}
                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition duration-200 font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.416c-.36-.18-.756-.314-1.193-.405L17.87 12.9h1.804c2.445 0 4.32-.616 5.293-2.566.404-1.258.26-2.246-.436-3.108-.618-.764-1.624-1.199-3.309-1.299z"/>
                </svg>
                Pagar con PayPal
              </button>
            )}

            {!hasStripe && !hasPayPal && (
              <div className="text-center py-3 text-gray-500">
                Plan no disponible temporalmente
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanCard;