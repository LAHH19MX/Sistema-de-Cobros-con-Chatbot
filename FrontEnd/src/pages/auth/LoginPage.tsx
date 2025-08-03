// src/pages/auth/LoginPage.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import '../../styles/auth/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signin, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    contra: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      Swal.fire({
        icon: 'success',
        title: 'Bienvenido',
        text: `${user.nombre}`,
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
        timerProgressBar: true
      });
      
      if (user.rol === 'admin') {
        navigate('/admin');
      } else if (user.rol === 'inquilino') {
        navigate('/inquilino');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.contra) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await signin(formData);
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data.message || 'Credenciales incorrectas');
        } else if (err.response.status === 500) {
          setError('Error en el servidor. Por favor intenta más tarde.');
        } else {
          setError('Error al iniciar sesión');
        }
      } else if (err.request) {
        setError('No se pudo conectar con el servidor');
      } else {
        setError('Error al procesar la solicitud');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Formulario principal */}
        <div className="login-form-section">
          <div className="login-form-wrapper">
            {/* Botón de volver */}
            <Link to="/" className="back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Volver al inicio</span>
            </Link>

            {/* Título */}
            <div className="login-header">
              <h1 className="login-title">Iniciar Sesión</h1>
              <p className="login-subtitle">
                Accede a tu cuenta
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="login-form">
              {/* Campo Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="form-group">
                <label htmlFor="contra" className="form-label">
                  Contraseña
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="contra"
                    name="contra"
                    value={formData.contra}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    disabled={isLoading}
                  >
                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Recordarme y Forgot Password */}
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={isLoading} />
                  <span>Recordarme</span>
                </label>
                <Link to="/restablecer" className="forgot-password">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Iniciando...</span>
                  </>
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </button>
            </form>

            {/* Link a registro */}
            <div className="register-link">
              <span>¿No tienes cuenta?</span>
              <Link to="/register">Regístrate</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}