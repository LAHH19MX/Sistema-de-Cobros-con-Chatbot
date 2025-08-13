import React, { useEffect } from 'react';
import {  useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/tenant/ExitoPage.css';

const ExitoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirección usando React Router
    const timer = setTimeout(() => {
      navigate('/tenant/dashboard', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoToDashboard = () => {
    navigate('/tenant/dashboard', { replace: true });
  };

  const handleGoToSubscription = () => {
    navigate('/tenant/suscripcion');
  };

  return (
    <div className="pg-exito">
      <div className="pg-exito__container">
        <div className="pg-exito__card">
          {/* Success Icon */}
          <div className="pg-exito__icon-wrapper">
            <svg className="pg-exito__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="pg-exito__title">
            ¡Suscripción Exitosa!
          </h1>
          
          <p className="pg-exito__description">
            ¡Bienvenido {user?.nombre}! Tu suscripción ha sido activada correctamente. 
            Ya puedes acceder a todas las funcionalidades de tu plan.
          </p>

          {sessionId && (
            <p className="pg-exito__session-id">
              ID de sesión: {sessionId}
            </p>
          )}

          {/* Actions */}
          <div className="pg-exito__actions">
            <button
              onClick={handleGoToDashboard}
              className="pg-exito__btn pg-exito__btn--primary"
            >
              Ir al Dashboard
            </button>
            
            <button
              onClick={handleGoToSubscription}
              className="pg-exito__btn pg-exito__btn--secondary"
            >
              Ver mi Suscripción
            </button>
          </div>

          {/* Auto redirect message */}
          <p className="pg-exito__redirect-message">
            Serás redirigido automáticamente al dashboard en 5 segundos...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExitoPage;