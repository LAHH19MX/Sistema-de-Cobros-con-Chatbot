import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CancelarPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.636 0L3.178 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Proceso Cancelado
          </h1>
          
          <p className="text-gray-600 mb-6">
            No te preocupes {user?.nombre}, tu proceso de suscripción fue cancelado. 
            Puedes intentar nuevamente cuando estés listo.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/tenant/planes"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium inline-block"
            >
              Ver Planes Nuevamente
            </Link>
            
            <Link
              to="/tenant/dashboard"
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-200 font-medium inline-block"
            >
              Volver al Inicio
            </Link>
          </div>

          {/* Help */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda? Contáctanos a{' '}
              <a href="mailto:soporte@ejemplo.com" className="text-blue-600 hover:text-blue-500">
                soporte@ejemplo.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelarPage;