import { Link } from 'react-router-dom';
import '../../styles/tenant/HeaderTenant.css';

export interface HeaderTenantProps {
  toggleSidebar: () => void;
  userName: string;
  userPhoto?: string; 
  onLogout: () => void;
}

const HeaderTenant: React.FC<HeaderTenantProps> = ({
  toggleSidebar,
  userName,
  userPhoto, 
  onLogout,
}) => (
  <header className="tenant-header">
    <div className="tenant-header__left">
      <button
        className="tenant-header__toggle d-md-none"
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars"></i>
      </button>
    </div>

    <div className="dropdown tenant-header__user">
      <a
        className="dropdown-toggle tenant-header__user-toggle"
        href="#"
        role="button"
        id="userDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <img
          src={userPhoto || "https://marketplace.canva.com/N2Y1c/MAEbiyN2Y1c/1/tl/canva-user-profile-avatar-MAEbiyN2Y1c.png"} 
          alt="Usuario"
          className="tenant-header__avatar"
        />
        <span>{userName || 'Inquilino'}</span>
      </a>

      <ul
        className="dropdown-menu dropdown-menu-end"
        aria-labelledby="userDropdown"
      >
        <li>
          <Link to="/tenant/perfil" className="dropdown-item">
            <i className="fas fa-user me-2"></i> Perfil
          </Link>
        </li>
        <li>
          <Link to="/tenant/suscripcion/gestion" className="dropdown-item">
            <i className="fas fa-credit-card me-2"></i> Mi Suscripción
          </Link>
        </li>
        <li>
          <Link to="/tenant/configuracion" className="dropdown-item">
            <i className="fas fa-cog me-2"></i> Configuración
          </Link>
        </li>
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <button type="button" className="dropdown-item" onClick={onLogout}>
            <i className="fas fa-sign-out-alt me-2"></i> Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  </header>
);

export default HeaderTenant;