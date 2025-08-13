import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { restablecerPassword } from '../../api/recuperacion';
import { passwordRegex, validationMessages } from '../../utils/validateRegister';
import '../../styles/auth/RestablecerPassword.css';

export default function RestablecerPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Obtener datos del localStorage
  const email = localStorage.getItem('recuperacion_email') || '';
  const codigo = localStorage.getItem('recuperacion_codigo') || '';
  const tipoUsuario = localStorage.getItem('recuperacion_tipo_usuario') || '';

  // Verificar que tenemos los datos necesarios
  useEffect(() => {
    if (!email || !codigo) {
      navigate('/solicitarRecuperacion');
    }
  }, [email, codigo, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar contraseña con tu regex
    if (!passwordRegex.test(password)) {
      setError(validationMessages.password);
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError(validationMessages.confirmPassword);
      return;
    }

    setIsLoading(true);
    
    try {
      await restablecerPassword({
        email,
        codigo,
        nuevaPassword: password
      });
      
      setSuccess(true);
      
      // Limpiar localStorage
      localStorage.removeItem('recuperacion_email');
      localStorage.removeItem('recuperacion_codigo');
      localStorage.removeItem('recuperacion_tipo_usuario');
      
      // Mostrar mensaje de éxito y redirigir
      setTimeout(() => {
        // Redirigir a login
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        
        // Si el código expiró o es inválido, regresar al inicio
        if (err.response.data.error.includes('Código inválido') || 
            err.response.data.error.includes('expirado')) {
          setTimeout(() => {
            navigate('/solicitarRecuperacion');
          }, 2000);
        }
      } else {
        setError('Error al restablecer la contraseña. Por favor, intenta nuevamente.');
      }
      setIsLoading(false);
    }
  };

  // Función para validar la fortaleza de la contraseña basada en tu regex
  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    const requirements = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar];
    const metRequirements = requirements.filter(Boolean).length;
    
    if (metRequirements <= 2) return 'weak';
    if (metRequirements <= 4) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength();
  
  // Función para mostrar qué requisitos cumple la contraseña
  const getPasswordRequirements = () => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    };
  };

  const requirements = password ? getPasswordRequirements() : null;

  return (
    <div className="vista-rp">
      <div className="vista-rp__container">
        <div className="vista-rp__form-section">
          <div className="vista-rp__form-wrapper">
            <Link to="/validar-codigo" className="vista-rp__back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Volver</span>
            </Link>

            <div className="vista-rp__header">
              <h1 className="vista-rp__title">Restablecer contraseña</h1>
              <p className="vista-rp__subtitle">
                Crea una nueva contraseña para tu cuenta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="vista-rp__form">
              {/* Campo de email no editable */}
              <div className="vista-rp__form-group">
                <label htmlFor="email" className="vista-rp__form-label">
                  Email
                </label>
                <div className="vista-rp__input-wrapper">
                  <i className="fas fa-envelope vista-rp__input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    className="vista-rp__form-input"
                    disabled
                  />
                </div>
              </div>

              <div className="vista-rp__form-group">
                <label htmlFor="password" className="vista-rp__form-label">
                  Nueva contraseña
                </label>
                <div className="vista-rp__input-wrapper">
                  <i className="fas fa-lock vista-rp__input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres, mayúscula..."
                    className="vista-rp__form-input"
                    required
                    disabled={isLoading || success}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="vista-rp__password-toggle"
                    disabled={isLoading || success}
                  >
                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                
                {/* Indicador de fortaleza de contraseña con requisitos */}
                {password && (
                  <div className="vista-rp__password-strength" style={{ 
                    marginTop: '8px',
                    fontSize: '12px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      <div style={{ 
                        flex: 1, 
                        height: '3px', 
                        backgroundColor: passwordStrength === 'weak' ? '#ef4444' : 
                                       passwordStrength === 'medium' ? '#f59e0b' : '#10b981',
                        borderRadius: '2px'
                      }}></div>
                      <div style={{ 
                        flex: 1, 
                        height: '3px', 
                        backgroundColor: passwordStrength === 'medium' ? '#f59e0b' : 
                                       passwordStrength === 'strong' ? '#10b981' : '#e5e7eb',
                        borderRadius: '2px'
                      }}></div>
                      <div style={{ 
                        flex: 1, 
                        height: '3px', 
                        backgroundColor: passwordStrength === 'strong' ? '#10b981' : '#e5e7eb',
                        borderRadius: '2px'
                      }}></div>
                    </div>
                    
                    {/* Lista de requisitos */}
                    {requirements && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ 
                          color: requirements.minLength ? '#10b981' : '#6b7280',
                          marginBottom: '2px'
                        }}>
                          <i className={`fas fa-${requirements.minLength ? 'check' : 'times'}-circle`}></i>
                          {' '} Mínimo 8 caracteres
                        </div>
                        <div style={{ 
                          color: requirements.hasUpperCase ? '#10b981' : '#6b7280',
                          marginBottom: '2px'
                        }}>
                          <i className={`fas fa-${requirements.hasUpperCase ? 'check' : 'times'}-circle`}></i>
                          {' '} Una letra mayúscula
                        </div>
                        <div style={{ 
                          color: requirements.hasLowerCase ? '#10b981' : '#6b7280',
                          marginBottom: '2px'
                        }}>
                          <i className={`fas fa-${requirements.hasLowerCase ? 'check' : 'times'}-circle`}></i>
                          {' '} Una letra minúscula
                        </div>
                        <div style={{ 
                          color: requirements.hasNumber ? '#10b981' : '#6b7280',
                          marginBottom: '2px'
                        }}>
                          <i className={`fas fa-${requirements.hasNumber ? 'check' : 'times'}-circle`}></i>
                          {' '} Un número
                        </div>
                        <div style={{ 
                          color: requirements.hasSpecialChar ? '#10b981' : '#6b7280'
                        }}>
                          <i className={`fas fa-${requirements.hasSpecialChar ? 'check' : 'times'}-circle`}></i>
                          {' '} Un carácter especial (@$!%*?&)
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="vista-rp__form-group">
                <label htmlFor="confirmPassword" className="vista-rp__form-label">
                  Confirmar contraseña
                </label>
                <div className="vista-rp__input-wrapper">
                  <i className="fas fa-lock vista-rp__input-icon"></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="vista-rp__form-input"
                    required
                    disabled={isLoading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="vista-rp__password-toggle"
                    disabled={isLoading || success}
                  >
                    <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                
                {/* Indicador de coincidencia */}
                {confirmPassword && (
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '12px',
                    color: password === confirmPassword ? '#10b981' : '#ef4444'
                  }}>
                    <i className={`fas fa-${password === confirmPassword ? 'check' : 'times'}-circle`}></i>
                    {' '}
                    {password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </div>
                )}
              </div>

              {error && (
                <div className="vista-rp__error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="vista-rp__success-message" style={{ 
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
                  <span>Contraseña actualizada exitosamente. Redirigiendo...</span>
                </div>
              )}

              <button
                type="submit"
                className="vista-rp__submit-button"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Guardando...</span>
                  </>
                ) : success ? (
                  <>
                    <i className="fas fa-check"></i>
                    <span>Contraseña actualizada</span>
                  </>
                ) : (
                  <span>Guardar contraseña</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}