import React, { useState, useEffect } from 'react';
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

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface PerfilData {
  id_inquilino: string;
  nombre_inquilino: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono_inquilino: string;
  direccion_inquilino: string;
  foto_inquilino: string;
  email_inquilino: string;
}

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
  
  // Estado inicial con todos los campos necesarios
  const [perfilData, setPerfilData] = useState<PerfilData>({
    id_inquilino: '',
    nombre_inquilino: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono_inquilino: '',
    direccion_inquilino: '',
    foto_inquilino: '',
    email_inquilino: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    password_actual: "",
    password_nueva: "",
    confirmar_password: ""
  });

  // Cargar script de Cloudinary
  useEffect(() => {
    if (!document.getElementById('cloudinary-script')) {
      const script = document.createElement('script');
      script.id = 'cloudinary-script';
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Cargar datos del perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoading(true);
        const response = await getPerfil();
        const perfil = response.data;
        
        setPerfilData({
          id_inquilino: perfil.id_inquilino,
          nombre_inquilino: perfil.nombre_inquilino || "",
          apellido_paterno: perfil.apellido_paterno || "",
          apellido_materno: perfil.apellido_materno || "",
          telefono_inquilino: perfil.telefono_inquilino || "",
          direccion_inquilino: perfil.direccion_inquilino || "",
          foto_inquilino: perfil.foto_inquilino || "",
          email_inquilino: perfil.email_inquilino || ""
        });
        
      } catch (error) {
        setError("Error al cargar el perfil");
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPerfilData({
      ...perfilData,
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
  
  // Función para subir imagen a Cloudinary
  const openCloudinaryWidget = () => {
    if (window.cloudinary) {
      const cloudinaryWidget = window.cloudinary.createUploadWidget(
        {
          cloudName: 'dca3qcakg', 
          uploadPreset: 'ml_default',
          sources: ['local', 'url', 'camera'],
          multiple: false,
          cropping: true,
          showAdvancedOptions: true,
          styles: {
            palette: {
              window: "#FFFFFF",
              sourceBg: "#F4F4F5",
              windowBorder: "#90a0b3",
              tabIcon: "#000000",
              inactiveTabIcon: "#555a5f",
              menuIcons: "#555a5f",
              link: "#000000",
              action: "#000000",
              inProgress: "#000000",
              complete: "#000000",
              error: "#ff0000",
              textDark: "#000000",
              textLight: "#fcfffd"
            }
          }
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Error en Cloudinary:", error);
            Swal.fire({
              icon: 'error',
              title: 'Error al subir imagen',
              text: error.message || "Intenta de nuevo más tarde",
              confirmButtonColor: '#3085d6',
            });
          }
          else if (result && result.event === 'success') {
            const imageUrl = result.info.secure_url;
            setPerfilData({
              ...perfilData,
              foto_inquilino: imageUrl
            });
            
            Swal.fire({
              icon: 'success',
              title: '¡Imagen subida!',
              text: 'La foto de perfil se ha actualizado',
              confirmButtonColor: '#3085d6',
            });
          }
        }
      );

      cloudinaryWidget.open();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el servicio de imágenes',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  // Guardar datos en la base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Verificar que tenemos el ID
      if (!perfilData.id_inquilino) {
        throw new Error("No se encontró ID de inquilino");
      }
      
      // Preparar datos para enviar
      const payload = {
        id_inquilino: perfilData.id_inquilino,
        nombre_inquilino: perfilData.nombre_inquilino,
        apellido_paterno: perfilData.apellido_paterno,
        apellido_materno: perfilData.apellido_materno,
        telefono_inquilino: perfilData.telefono_inquilino,
        direccion_inquilino: perfilData.direccion_inquilino,
        foto_inquilino: perfilData.foto_inquilino,
        email_inquilino: perfilData.email_inquilino
      };
      
      console.log("Enviando a backend:", payload);
      
      // Llamar a la API
      const response = await updatePerfil(payload);
      
      Swal.fire({
        icon: 'success',
        title: '¡Perfil actualizado!',
        text: 'Tu perfil se ha actualizado exitosamente',
        confirmButtonColor: '#3085d6',
      });
      
      // Actualizar datos locales
      setPerfilData({
        ...perfilData,
        ...response.data.perfil
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al actualizar";
      setError(errorMessage);
      console.error("Error actualizando perfil:", error);
    } finally {
      setSaving(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);
    
    try {
      if (passwordData.password_nueva !== passwordData.confirmar_password) {
        throw new Error("Las contraseñas no coinciden");
      }
      
      await changePassword({
        password_actual: passwordData.password_actual,
        password_nueva: passwordData.password_nueva,
        confirmar_password: passwordData.confirmar_password
      });
      
      setPasswordData({
        password_actual: "",
        password_nueva: "",
        confirmar_password: ""
      });
      
      Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña se ha cambiado exitosamente',
        confirmButtonColor: '#3085d6',
      });
      
      setShowPasswordModal(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al cambiar contraseña";
      setPasswordError(errorMessage);
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

      <div className="client-perfil__main-section">
        <div className="client-perfil__profile-grid">
          <div className="client-perfil__photo-section">
            <div className="client-perfil__profile-photo-container">
              <img 
                src={perfilData.foto_inquilino || "https://marketplace.canva.com/N2Y1c/MAEbiyN2Y1c/1/tl/canva-user-profile-avatar-MAEbiyN2Y1c.png"} 
                alt="Foto de perfil" 
                className="client-perfil__profile-photo" 
              />
              <label 
                className="client-perfil__photo-overlay"
                onClick={openCloudinaryWidget}
              >
                <FontAwesomeIcon icon={faCamera} />
              </label>
            </div>
            <button 
              className="client-perfil__btn-upload"
              onClick={openCloudinaryWidget}
            >
              <FontAwesomeIcon icon={faUpload} className="client-perfil__btn-icon" />
              Cambiar Foto
            </button>
            <p className="client-perfil__upload-info">
              Haz clic para subir una nueva foto de perfil
            </p>
          </div>

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
                    value={perfilData.nombre_inquilino}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Apellido Paterno</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="apellido_paterno"
                    value={perfilData.apellido_paterno}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Apellido Materno</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="apellido_materno"
                    value={perfilData.apellido_materno}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group">
                  <label className="client-perfil__form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    className="client-perfil__form-control" 
                    name="telefono_inquilino"
                    value={perfilData.telefono_inquilino}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group client-perfil__form-group--full">
                  <label className="client-perfil__form-label">Dirección</label>
                  <input 
                    type="text" 
                    className="client-perfil__form-control" 
                    name="direccion_inquilino"
                    value={perfilData.direccion_inquilino}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-perfil__form-group client-perfil__form-group--full">
                  <label className="client-perfil__form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="client-perfil__form-control" 
                    name="email_inquilino"
                    value={perfilData.email_inquilino}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

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

              <div className="client-perfil__form-actions">
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
                      minLength={8}
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