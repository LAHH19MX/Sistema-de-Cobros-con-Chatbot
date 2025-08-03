import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faCamera, faUpload, 
  faKey, faSave, faEye, faEyeSlash, faTimes 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { 
  getPerfil, 
  updatePerfil, 
  changePassword 
} from '../../api/settingsTenant';
import '../../styles/tenant/PerfilTenant.css';

const PerfilTenant = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre_inquilino: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono_inquilino: "",
    direccion_inquilino: "",
    foto_inquilino: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    password_actual: "",
    password_nueva: "",
    confirmar_password: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos del perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoading(true);
        const response = await getPerfil();
        const perfil = response.data;
        
        setFormData({
          nombre_inquilino: perfil.nombre_inquilino || "",
          apellido_paterno: perfil.apellido_paterno || "",
          apellido_materno: perfil.apellido_materno || "",
          telefono_inquilino: perfil.telefono_inquilino || "",
          direccion_inquilino: perfil.direccion_inquilino || "",
          foto_inquilino: perfil.foto_inquilino || ""
        });
        
      } catch (error) {
        setError("Error al cargar el perfil");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData({
          ...formData,
          foto_inquilino: reader.result as string
        });
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Enviar solo campos actualizables
      const { foto_inquilino, ...datosActualizables } = formData;
      const payload = {
        ...datosActualizables,
        ...(foto_inquilino && { foto_inquilino })
      };
      
      await updatePerfil(payload);
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Perfil actualizado!',
        text: 'Tu perfil se ha actualizado exitosamente',
        confirmButtonColor: '#3085d6',
      });
    } catch (error) {
      setError("Error al actualizar el perfil");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);
    
    try {
      // Validar que las contraseñas coincidan
      if (passwordData.password_nueva !== passwordData.confirmar_password) {
        throw new Error("Las contraseñas no coinciden");
      }
      
      await changePassword(passwordData);
      setPasswordData({
        password_actual: "",
        password_nueva: "",
        confirmar_password: ""
      });
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña se ha cambiado exitosamente',
        confirmButtonColor: '#3085d6',
      });
      
      setShowPasswordModal(false);
    } catch (error: any) {
      setPasswordError(error.message || "Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="client-perfil">
      {/* Header de página */}
      <div className="client-perfil__page-header">
        <h1 className="client-perfil__page-title">
          <FontAwesomeIcon icon={faUser} className="client-perfil__title-icon" />
          Mi Perfil
        </h1>
        <p className="client-perfil__page-subtitle">
          Administra tu información personal y preferencias
        </p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Contenido principal */}
      <div className="client-perfil__main-section">
        <div className="client-perfil__profile-grid">
          {/* Sección de foto */}
          <div className="client-perfil__photo-section">
            <div className="client-perfil__profile-photo-container">
              <img 
                src={formData.foto_inquilino || "https://randomuser.me/api/portraits/men/45.jpg"} 
                alt="Foto de perfil" 
                className="client-perfil__profile-photo" 
              />
              <label 
                htmlFor="photoInput" 
                className="client-perfil__photo-overlay"
                onClick={triggerFileInput}
              >
                <FontAwesomeIcon icon={faCamera} />
              </label>
              <input 
                type="file" 
                id="photoInput" 
                ref={fileInputRef}
                className="client-perfil__upload-input" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <button 
              className="client-perfil__btn-upload"
              onClick={triggerFileInput}
            >
              <FontAwesomeIcon icon={faUpload} className="client-perfil__btn-icon" />
              Cambiar Foto
            </button>
            <p className="client-perfil__upload-info">
              JPG, PNG o GIF. Tamaño máximo 2MB
            </p>
          </div>

          {/* Sección de información */}
          <div className="client-perfil__info-section">
            <h3 className="client-perfil__section-title">Información Personal</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="client-perfil__form-grid">
                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Nombre</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="nombre_inquilino"
                    value={formData.nombre_inquilino}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Apellido Paterno</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="apellido_paterno"
                    value={formData.apellido_paterno}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Apellido Materno</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="apellido_materno"
                    value={formData.apellido_materno}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    className="client-perfil__form-control" 
                    name="telefono_inquilino"
                    value={formData.telefono_inquilino}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group client-perfil__form-group--full">
                  <label className="client-perfil__form-label">Dirección</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="direccion_inquilino"
                    value={formData.direccion_inquilino}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Sección de contraseña */}
              <div className="client-perfil__password-section">
                <h4 className="client-perfil__section-subtitle">Seguridad</h4>
                <button 
                  type="button" 
                  className="client-perfil__btn-change-password"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <FontAwesomeIcon icon={faKey} className="client-perfil__btn-icon" />
                  Cambiar Contraseña
                </button>
              </div>

              {/* Botones de acción */}
              <div className="client-perfil__form-actions">
                <button type="button" className="client-perfil__btn client-perfil__btn--secondary">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="client-perfil__btn client-perfil__btn--primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="client-perfil__btn-icon" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div className="client-perfil__modal-overlay">
          <div className="client-perfil__modal">
            <div className="client-perfil__modal-header">
              <h3 className="client-perfil__modal-title">
                <FontAwesomeIcon icon={faKey} className="client-perfil__modal-icon" />
                Cambiar Contraseña
              </h3>
              <button 
                className="client-perfil__modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="client-perfil__modal-body">
              {passwordError && <div className="alert alert-danger">{passwordError}</div>}
              <form onSubmit={handlePasswordSubmit}>
                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Contraseña Actual</label>
                  <div className="client-perfil__input-group-password">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      className="client-perfil__form-control" 
                      name="password_actual"
                      value={passwordData.password_actual}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button 
                      type="button" 
                      className="client-perfil__btn-toggle-password"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Nueva Contraseña</label>
                  <div className="client-perfil__input-group-password">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      className="client-perfil__form-control" 
                      name="password_nueva"
                      value={passwordData.password_nueva}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                    <button 
                      type="button" 
                      className="client-perfil__btn-toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  <small className="client-perfil__form-text">
                    Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
                  </small>
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Confirmar Nueva Contraseña</label>
                  <div className="client-perfil__input-group-password">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="client-perfil__form-control" 
                      name="confirmar_password"
                      value={passwordData.confirmar_password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button 
                      type="button" 
                      className="client-perfil__btn-toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                
                <div className="client-perfil__modal-actions">
                  <button 
                    type="button" 
                    className="client-perfil__btn client-perfil__btn--secondary"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="client-perfil__btn client-perfil__btn--primary"
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Cambiando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="client-perfil__btn-icon" />
                        Cambiar Contraseña
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilTenant;