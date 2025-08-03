import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { registerRequest } from '../../api/auth';
import type { RegisterData } from '../../api/auth';
import { validateForm } from '../../utils/validateRegister';
import '../../styles/auth/register.css';

const RegisterPage: React.FC = () => {
  const { signin } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    foto: '',
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al editar
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    
    // Limpiar error al editar
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const errors = validateForm(formData, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      
      // Mostrar SweetAlert para el primer error
      const firstErrorKey = Object.keys(errors)[0];
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: errors[firstErrorKey],
        confirmButtonColor: '#f07177',
      });
      
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Registrar usuario
      await registerRequest(formData);
      
      // Auto-login después del registro
      await signin({
        email: formData.email,
        contra: formData.password
      });
      
    } catch (err: any) {
      console.error('Error en registro:', err);
      
      // Mostrar error con SweetAlert2
      let errorMessage = 'Error de conexión. Inténtalo de nuevo.';
      if (err.response?.status === 400) {
        errorMessage = err.response.data.message || 'Error en los datos proporcionados';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error en registro',
        text: errorMessage,
        confirmButtonColor: '#f07177',
      });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-section">
          <div className="register-form-wrapper">
            <Link to="/" className="back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Volver al inicio</span>
            </Link>

            <div className="register-header">
              <h2 className="register-title">Crear cuenta</h2>
              <p className="register-subtitle">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="register-link">
                  Inicia sesión
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-fields">
                {/* Fila 1: Nombre completo */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nombre" className="form-label">
                      Nombre *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-user input-icon"></i>
                      <input
                        id="nombre"
                        name="nombre"
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.nombre ? 'input-error' : ''}`}
                        placeholder="Tu nombre"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.nombre && <div className="field-error">{fieldErrors.nombre}</div>}
                  </div>
                </div>

                {/* Fila 2: Apellidos */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="apellido_paterno" className="form-label">
                      Apellido Paterno *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-user input-icon"></i>
                      <input
                        id="apellido_paterno"
                        name="apellido_paterno"
                        type="text"
                        required
                        value={formData.apellido_paterno}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.apellido_paterno ? 'input-error' : ''}`}
                        placeholder="Apellido paterno"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.apellido_paterno && <div className="field-error">{fieldErrors.apellido_paterno}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="apellido_materno" className="form-label">
                      Apellido Materno *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-user input-icon"></i>
                      <input
                        id="apellido_materno"
                        name="apellido_materno"
                        type="text"
                        required
                        value={formData.apellido_materno}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.apellido_materno ? 'input-error' : ''}`}
                        placeholder="Apellido materno"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.apellido_materno && <div className="field-error">{fieldErrors.apellido_materno}</div>}
                  </div>
                </div>

                {/* Fila 3: Email */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-envelope input-icon"></i>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                        placeholder="tu@email.com"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
                  </div>
                </div>

                {/* Fila 4: Teléfono y Contraseña */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="telefono" className="form-label">
                      Teléfono *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-phone input-icon"></i>
                      <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.telefono ? 'input-error' : ''}`}
                        placeholder="5512345678"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.telefono && <div className="field-error">{fieldErrors.telefono}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Contraseña *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                        placeholder="Mínimo 8 caracteres"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                  </div>
                </div>

                {/* Fila 5: Confirmar Contraseña y Foto */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmar Contraseña *
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirma tu contraseña"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="foto" className="form-label">
                      Foto <span className="optional-text">(opcional)</span>
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-camera input-icon"></i>
                      <input
                        id="foto"
                        name="foto"
                        type="text"
                        value={formData.foto}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="URL de tu foto"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Fila 6: Dirección */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="direccion" className="form-label">
                      Dirección <span className="optional-text">(opcional)</span>
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-home input-icon"></i>
                      <input
                        id="direccion"
                        name="direccion"
                        type="text"
                        value={formData.direccion}
                        onChange={handleChange}
                        className={`form-input ${fieldErrors.direccion ? 'input-error' : ''}`}
                        placeholder="Tu dirección"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.direccion && <div className="field-error">{fieldErrors.direccion}</div>}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <span>Crear cuenta</span>
                  )}
                </button>
              </div>

              <div className="terms-text">
                <p>
                  Al crear una cuenta, aceptas nuestros{' '}
                  <Link to="/terminos">Términos de Servicio</Link>{' '}
                  y{' '}
                  <Link to="/politicas">Política de Privacidad</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;