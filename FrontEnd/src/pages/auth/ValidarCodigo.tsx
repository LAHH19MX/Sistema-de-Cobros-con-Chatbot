import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validarCodigo, reenviarCodigo } from '../../api/recuperacion';
import '../../styles/auth/ValidarCodigo.css';

export default function ValidarCodigo() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // Timer de 60 segundos
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener email del localStorage
  const email = localStorage.getItem('recuperacion_email') || '';

  // Verificar que hay un email guardado
  useEffect(() => {
    if (!email) {
      navigate('/solicitarRecuperacion');
    }
  }, [email, navigate]);

  // Inicializar el array de referencias
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Enfocar el primer input al cargar
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, canResend]);

  // Función para crear referencias estables
  const setInputRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  const handleChange = (index: number, value: string) => {
    // Solo permitir dígitos
    if (value !== '' && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('');
    
    // Mover al siguiente input si se ingresó un dígito
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Manejar retroceso para regresar al input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('').slice(0, 6);
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await validarCodigo({ 
        email, 
        codigo: fullCode 
      });
      
      // Guardar el email y datos necesarios para la siguiente vista
      localStorage.setItem('recuperacion_email', email); // Guardar el email
      localStorage.setItem('recuperacion_tipo_usuario', response.data.tipo_usuario);
      localStorage.setItem('recuperacion_codigo', fullCode);
      
      setSuccess('Código validado correctamente');
      
      // Navegar después de un momento
      setTimeout(() => {
        navigate('/restablecer-password');
      }, 1000);
      
    } catch (err: any) {
      console.error('Error al validar código:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        
        // Si hay demasiados intentos, limpiar el código
        if (err.response.data.error.includes('Demasiados intentos')) {
          setCode(['', '', '', '', '', '']);
          setCanResend(true);
        }
      } else {
        setError('Error al validar el código. Por favor, intenta nuevamente.');
      }
      
      // Limpiar el código en caso de error
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      await reenviarCodigo({ email });
      
      // Reiniciar el timer
      setTimeLeft(60);
      setCanResend(false);
      setSuccess('Código reenviado exitosamente. Revisa tu correo.');
      
      // Limpiar el código
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      
    } catch (err: any) {
      console.error('Error al reenviar código:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al reenviar el código. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Formatear el tiempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="vista-vc">
      <div className="vista-vc__container">
        <div className="vista-vc__form-section">
          <div className="vista-vc__form-wrapper">
            <Link to="/solicitarRecuperacion" className="vista-vc__back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Volver</span>
            </Link>

            <div className="vista-vc__header">
              <h1 className="vista-vc__title">Verificar código</h1>
              <p className="vista-vc__subtitle">
                Ingresa el código de 6 dígitos que enviamos a {email}
              </p>
              {!canResend && (
                <p className="vista-vc__timer" style={{ 
                  marginTop: '8px', 
                  color: timeLeft < 10 ? '#ef4444' : '#6b7280',
                  fontSize: '14px'
                }}>
                  <i className="fas fa-clock"></i> Código expira en: {formatTime(timeLeft)}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="vista-vc__form">
              <div className="vista-vc__form-group">
                <label className="vista-vc__form-label">
                  Código de verificación
                </label>
                
                <div 
                  className="vista-vc__code-inputs" 
                  onPaste={handlePaste}
                >
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={setInputRef(index)}
                      type="text"
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="vista-vc__code-input"
                      maxLength={1}
                      inputMode="numeric"
                      required
                      disabled={isLoading || isResending}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="vista-vc__error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="vista-vc__success-message" style={{ 
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
                  <span>{success}</span>
                </div>
              )}

              <div className="vista-vc__button-group">
                <button
                  type="submit"
                  className="vista-vc__submit-button"
                  disabled={isLoading || isResending}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Validando...</span>
                    </>
                  ) : (
                    <span>Continuar</span>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleResend}
                  className="vista-vc__resend-button"
                  disabled={!canResend || isResending}
                  style={{ opacity: canResend ? 1 : 0.5 }}
                >
                  {isResending ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Reenviando...</span>
                    </>
                  ) : canResend ? (
                    'Reenviar código'
                  ) : (
                    `Reenviar a las ${formatTime(timeLeft)}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}