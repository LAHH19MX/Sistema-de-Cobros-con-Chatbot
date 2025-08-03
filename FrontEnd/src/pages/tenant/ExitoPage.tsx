import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ExitoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Opcional: verificar el estado de la suscripción después de 3 segundos
    const timer = setTimeout(() => {
      window.location.href = '/tenant/dashboard';
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Suscripción Exitosa!
          </h1>
          
          <p className="text-gray-600 mb-6">
            ¡Bienvenido {user?.nombre}! Tu suscripción ha sido activada correctamente. 
            Ya puedes acceder a todas las funcionalidades de tu plan.
          </p>

          {sessionId && (
            <p className="text-sm text-gray-500 mb-6">
              ID de sesión: {sessionId}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/tenant/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium inline-block"
            >
              Ir al Dashboard
            </Link>
            
            <Link
              to="/tenant/suscripcion"
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-200 font-medium inline-block"
            >
              Ver mi Suscripción
            </Link>
          </div>

          {/* Auto redirect message */}
          <p className="text-xs text-gray-400 mt-6">
            Serás redirigido automáticamente al dashboard en 5 segundos...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExitoPage;