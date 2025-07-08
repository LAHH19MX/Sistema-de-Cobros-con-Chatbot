// src/components/layout/AdminLayout.tsx
import '../../styles/admin/AdminLayout.css'; 
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isContentMenuOpen, setIsContentMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'admin-nav__link--active' : '';
  };

  const toggleContentMenu = () => {
    setIsContentMenuOpen(!isContentMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.admin-header__user')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="admin">
      {/* Barra lateral */}
      <aside className="admin__sidebar">
        <div className="admin__logo">
          <img src="https://cdn-icons-png.flaticon.com/512/187/187863.png" alt="Logo Empresa" />
        </div>
        <nav className="admin-nav">
          <ul className="admin-nav__list">
            <li className="admin-nav__item">
              <Link className={`admin-nav__link ${isActive('/admin')}`} to="/admin">
                <i className="fas fa-home admin-nav__icon"></i> 
                <span className="admin-nav__text">Inicio</span>
              </Link>
            </li>
            <li className="admin-nav__item">
              <Link className={`admin-nav__link ${isActive('/admin/clientes')}`} to="/admin/clientes">
                <i className="fas fa-users admin-nav__icon"></i> 
                <span className="admin-nav__text">Clientes</span>
              </Link>
            </li>
            <li className="admin-nav__item">
              <Link className={`admin-nav__link ${isActive('/admin/suscripciones')}`} to="/admin/suscripciones">
                <i className="fas fa-credit-card admin-nav__icon"></i> 
                <span className="admin-nav__text">Gestión de Suscripciones</span>
              </Link>
            </li>
            <li className="admin-nav__item">
              <Link className={`admin-nav__link ${isActive('/admin/ingresos')}`} to="/admin/ingresos">
                <i className="fas fa-chart-line admin-nav__icon"></i> 
                <span className="admin-nav__text">Ingresos</span>
              </Link>
            </li>
            <li className="admin-nav__item">
              <button 
                className="admin-nav__link admin-nav__link--button"
                onClick={toggleContentMenu}
              >
                <i className="fas fa-cog admin-nav__icon"></i> 
                <span className="admin-nav__text">Administrar Contenido</span>
                <i className={`fas fa-chevron-${isContentMenuOpen ? 'up' : 'down'} admin-nav__arrow`}></i>
              </button>
              <div className={`admin-nav__submenu ${isContentMenuOpen ? 'admin-nav__submenu--open' : ''}`}>
                <ul className="admin-nav__sublist">
                  <li className="admin-nav__subitem">
                    <Link className="admin-nav__sublink" to="/admin/contenido/inicio">Inicio</Link>
                  </li>
                  <li className="admin-nav__subitem">
                    <Link className="admin-nav__sublink" to="/admin/contenido/blog">Blog</Link>
                  </li>
                  <li className="admin-nav__subitem">
                    <Link className="admin-nav__sublink" to="/admin/contenido/faq">FAQ</Link>
                  </li>
                  <li className="admin-nav__subitem">
                    <Link className="admin-nav__sublink" to="/admin/contenido/myv">MyV</Link>
                  </li>
                  <li className="admin-nav__subitem">
                    <Link className="admin-nav__sublink" to="/admin/contenido/nuevo">
                      <i className="fas fa-plus-circle"></i> Nuevo Apartado
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="admin__main">
        {/* Header superior */}
        <header className="admin-header">
          <div className="admin-header__user">
            <button 
              className="admin-header__toggle" 
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              <img 
                src="https://randomuser.me/api/portraits/men/32.jpg" 
                alt="Usuario" 
                className="admin-header__avatar" 
              />
              <span className="admin-header__name">{user?.nombre || 'Admin'}</span>
            </button>
            <ul className={`admin-header__dropdown ${isDropdownOpen ? 'admin-header__dropdown--open' : ''}`}>
              <li className="admin-header__dropdown-item">
                <Link className="admin-header__dropdown-link" to="/admin/perfil">
                  <i className="fas fa-user admin-header__dropdown-icon"></i> Perfil
                </Link>
              </li>
              <li className="admin-header__dropdown-item">
                <Link className="admin-header__dropdown-link" to="/admin/configuracion">
                  <i className="fas fa-cog admin-header__dropdown-icon"></i> Configuración
                </Link>
              </li>
              <li className="admin-header__dropdown-divider"></li>
              <li className="admin-header__dropdown-item">
                <button className="admin-header__dropdown-link admin-header__dropdown-link--button" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt admin-header__dropdown-icon"></i> Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        </header>

        {/* Contenido dinámico */}
        <div className="admin__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;