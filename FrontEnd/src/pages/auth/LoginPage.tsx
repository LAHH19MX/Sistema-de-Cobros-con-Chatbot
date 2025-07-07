import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    try {
      // Aquí conectarás con el backend
    //   await signin(formData);
      navigate('/');
    } catch (err) {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Lado izquierdo - Formulario */}
        <div className="login-form-section">
          <div className="login-form-wrapper">
            {/* Logo */}
            <div className="login-logo">
              <Link to="/">
                <div className="logo-circle">
                  <span className="logo-text">LOGO</span>
                </div>
              </Link>
            </div>

            {/* Título */}
            <div className="login-header">
              <h1 className="login-title">Bienvenido de vuelta</h1>
              <p className="login-subtitle">
                Ingresa tus credenciales para acceder a tu cuenta
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="login-form">
              {/* Campo Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Correo electrónico
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
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

              {/* Opciones adicionales */}
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
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
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {/* Link a registro */}
            <div className="register-link">
              <span>¿No tienes una cuenta?</span>
              <Link to="/register">Regístrate aquí</Link>
            </div>
          </div>
        </div>

        {/* Lado derecho - Decorativo */}
        <div className="login-decoration">
          <div className="decoration-content">
            <h2>Gestiona tus cobros de manera inteligente</h2>
            <p>
              Automatiza recordatorios, genera enlaces de pago y mantén 
              el control de tus finanzas con nuestro sistema integrado.
            </p>
            <div className="decoration-features">
              <div className="feature">
                <i className="fas fa-chart-line"></i>
                <span>Análisis en tiempo real</span>
              </div>
              <div className="feature">
                <i className="fas fa-bell"></i>
                <span>Recordatorios automáticos</span>
              </div>
              <div className="feature">
                <i className="fas fa-shield-alt"></i>
                <span>Seguridad garantizada</span>
              </div>
            </div>
          </div>
          
          {/* Elementos decorativos */}
          <div className="decoration-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}