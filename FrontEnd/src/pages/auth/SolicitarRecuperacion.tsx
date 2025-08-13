import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { solicitarRecuperacion } from '../../api/recuperacion';
import '../../styles/auth/SolicitarRecuperacion.css';

export default function SolicitarRecuperacion() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await solicitarRecuperacion({ email });
      
      // Guardar email en localStorage para usarlo en la siguiente vista
      localStorage.setItem('recuperacion_email', email);
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Esperar un momento y luego navegar
      setTimeout(() => {
        navigate('/validar-codigo');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error al solicitar recuperación:', err);
      
      // Manejar diferentes tipos de error
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error') {
        setError('Error de conexión. Por favor, intenta nuevamente.');
      } else {
        setError('Ocurrió un error. Por favor, intenta nuevamente.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="vista-sr">
      <div className="vista-sr__container">
        <div className="vista-sr__form-section">
          <div className="vista-sr__form-wrapper">
            <Link to="/" className="vista-sr__back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Volver al inicio</span>
            </Link>

            <div className="vista-sr__header">
              <h1 className="vista-sr__title">Recuperar contraseña</h1>
              <p className="vista-sr__subtitle">
                Te enviaremos un código a tu correo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="vista-sr__form">
              <div className="vista-sr__form-group">
                <label htmlFor="email" className="vista-sr__form-label">
                  Email
                </label>
                <div className="vista-sr__input-wrapper">
                  <i className="fas fa-envelope vista-sr__input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="vista-sr__form-input"
                    required
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {error && (
                <div className="vista-sr__error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="vista-sr__success-message" style={{ 
                  color: '#10b981', 
                  backgroundColor: '#f0fdf4', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-check-circle"></i>
                  <span>Si el email existe, recibirás un código de recuperación</span>
                </div>
              )}

              <button
                type="submit"
                className="vista-sr__submit-button"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Enviando...</span>
                  </>
                ) : success ? (
                  <>
                    <i className="fas fa-check"></i>
                    <span>Código enviado</span>
                  </>
                ) : (
                  <span>Continuar</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}