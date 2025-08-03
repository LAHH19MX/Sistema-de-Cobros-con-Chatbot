import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/tenant/SideBar.css';          // no se altera la ruta

export interface SideBarTenantProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const SideBarTenant: React.FC<SideBarTenantProps> = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const handleLinkClick = () => {
    if (window.innerWidth < 992) closeSidebar();
  };

  return (
    <div className={`tenant-sidebar ${isOpen ? 'tenant-sidebar--open' : ''}`}>
      <div className="tenant-sidebar__logo">
        <img
          src="https://res.cloudinary.com/dca3qcakg/image/upload/v1753827209/LogoEmpresaSitio_oqfbzh.png"
          alt="Logo Empresa"
        />
      </div>

      <nav className="tenant-sidebar__menu">
        <ul className="tenant-sidebar__list nav flex-column">
          <li className="tenant-sidebar__item nav-item">
            <Link
              to="/tenant/dashboard"
              onClick={handleLinkClick}
              className={`tenant-sidebar__link nav-link ${
                location.pathname === '/tenant/dashboard' ? 'tenant-sidebar__link--active' : ''
              }`}
            >
              <i className="fas fa-home"></i> Inicio
            </Link>
          </li>

          {user?.hasSubscription && (
            <>
              <li className="tenant-sidebar__item nav-item">
                <Link
                  to="/tenant/clientes"
                  onClick={handleLinkClick}
                  className={`tenant-sidebar__link nav-link ${
                    location.pathname === '/tenant/clientes' ? 'tenant-sidebar__link--active' : ''
                  }`}
                >
                  <i className="fas fa-users"></i> Clientes
                </Link>
              </li>
              <li className="tenant-sidebar__item nav-item">
                <Link
                  to="/tenant/deudas"
                  onClick={handleLinkClick}
                  className={`tenant-sidebar__link nav-link ${
                    location.pathname === '/tenant/deudas' ? 'tenant-sidebar__link--active' : ''
                  }`}
                >
                  <i className="fas fa-money-bill-wave"></i> Deudas
                </Link>
              </li>
              <li className="tenant-sidebar__item nav-item">
                <Link
                  to="/tenant/clientes/morosos"
                  onClick={handleLinkClick}
                  className={`tenant-sidebar__link nav-link ${
                    location.pathname === '/tenant/clientes/morosos' ? 'tenant-sidebar__link--active' : ''
                  }`}
                >
                  <i className="fas fa-exclamation-triangle"></i> Clientes morosos
                </Link>
              </li>
              <li className="tenant-sidebar__item nav-item">
                <Link
                  to="/tenant/ingresos"
                  onClick={handleLinkClick}
                  className={`tenant-sidebar__link nav-link ${
                    location.pathname === '/tenant/ingresos' ? 'tenant-sidebar__link--active' : ''
                  }`}
                >
                  <i className="fas fa-chart-line"></i> Ingresos
                </Link>
              </li>
              <li className="tenant-sidebar__item nav-item">
                <Link
                  to="/tenant/api-docs"
                  onClick={handleLinkClick}
                  className={`tenant-sidebar__link nav-link ${
                    location.pathname === '/tenant/api-docs' ? 'tenant-sidebar__link--active' : ''
                  }`}
                >
                  <i className="fas fa-file-code"></i> Documentación&nbsp;API
                </Link>
              </li>
            </>
          )}

          <li className="tenant-sidebar__item nav-item">
            <Link
              to="/tenant/planes"
              onClick={handleLinkClick}
              className={`tenant-sidebar__link nav-link ${
                location.pathname === '/tenant/planes' ? 'tenant-sidebar__link--active' : ''
              }`}
            >
              <i className="fas fa-box"></i> Planes
            </Link>
          </li>

          {user?.hasSubscription && (
            <li className="tenant-sidebar__item nav-item">
              <Link
                to="/tenant/suscripcion"
                onClick={handleLinkClick}
                className={`tenant-sidebar__link nav-link ${
                  location.pathname === '/tenant/suscripcion' ? 'tenant-sidebar__link--active' : ''
                }`}
              >
                <i className="fas fa-credit-card"></i> Mi&nbsp;Suscripción
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default SideBarTenant;
