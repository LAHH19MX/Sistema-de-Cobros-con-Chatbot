import '../../styles/site/Header.css';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../../context/SiteDataContext';
import { useCompany } from '../../context/CompanyContext';

const Header: React.FC<{ onLogin: () => void; onStart: () => void }> = ({ onLogin, onStart }) => {
  const { apartados = [], categorias = [] } = useSiteData();
  const { empresa, loadEmpresa } = useCompany();
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadEmpresa('7c4fe9f1-b602-46c5-8ac3-2021cfe7245d');
      } catch (error) {
        console.error('Error cargando empresa:', error);
      }
    };
    
    if (!empresa && !logoLoaded) {
      loadData();
    }
  }, []);

  // Filtramos apartados activos que NO son de las plantillas especiales (incluyendo términos y políticas)
  const apartadosActivos = apartados.filter(apartado => 
    apartado?.activo_apartado && 
    ![
      'd3492653-a06e-4bf7-a4cf-b932b756da12', // Nosotros
      'c7636b14-2c44-48f9-a68d-46d1d19fc38c', // FAQ
      'd06799f2-5a41-49e4-bc6e-b71ef25460fd', // Términos
      '67537c80-0fcb-45d5-863b-ca8c2ce32d53'  // Políticas
    ].includes(apartado.id_plantilla)
  );

  // Apartados especiales para el dropdown de Nosotros (sin términos y políticas)
  const apartadosNosotros = apartados.filter(apartado => 
    apartado?.activo_apartado &&
    ['d3492653-a06e-4bf7-a4cf-b932b756da12', 'c7636b14-2c44-48f9-a68d-46d1d19fc38c']
    .includes(apartado.id_plantilla) && 
    !apartado.mostrar_categoria
  );

  // Función para obtener la ruta correcta según la plantilla
  const getRouteForApartado = (apartado: any) => {
    switch(apartado.id_plantilla) {
      case 'd3492653-a06e-4bf7-a4cf-b932b756da12':
        return '/nosotros';
      case 'c7636b14-2c44-48f9-a68d-46d1d19fc38c':
        return '/faq';
      case '2c9a6d51-3965-4383-ad3a-784bc5794545': // Blog
        return '/blog';
      case '50d449f8-0143-46f1-baeb-f43c66193898': // Precios
        return '/precios';
      default:
        return `/${apartado.nombre_apartado.toLowerCase()}`;
    }
  };

  return (
    <header className="custom-header">
      <div className="container">
        <nav className="navbar navbar-expand-md d-flex align-items-center p-0">
          <Link className="navbar-brand custom-header__logo pe-3" to="/">
            <img
              src={empresa?.logo_empresa}
              alt={`Logo ${empresa?.nombre_empresa || 'Empresa'}`}
              className="custom-header__logoImg"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(false)}
            />
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarHeader"
            aria-controls="navbarHeader"
            aria-expanded="false"
            aria-label="Menú"
          >
            <i className="fas fa-bars text-light" />
          </button>

          <div className="collapse navbar-collapse flex-column flex-md-row justify-content-between align-items-start align-items-md-center" id="navbarHeader">
            <ul className="navbar-nav d-flex flex-column flex-md-row gap-3 mx-auto mb-3 mb-md-0">
              {/* Apartados normales */}
              {apartadosActivos.map(apartado => (
                apartado.mostrar_categoria ? (
                  <li className="nav-item dropdown custom-header__navItem" key={apartado.id_apartado}>
                    <a
                      className="nav-link dropdown-toggle custom-header__navLink"
                      href="#"
                      id={`${apartado.id_apartado}Dropdown`}
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {apartado.nombre_apartado}
                    </a>
                    <ul className="dropdown-menu custom-header__dropdownMenu" aria-labelledby={`${apartado.id_apartado}Dropdown`}>
                      {categorias
                        .filter(cat => cat.id_apartado === apartado.id_apartado && cat.activo_categoria)
                        .map(cat => (
                          <li key={cat.id_categoria}>
                            <Link
                              className="dropdown-item custom-header__dropdownItem" 
                              to={`/categoria/${cat.id_categoria}`}
                              onClick={() => {
                                const dropdown = document.getElementById(`${apartado.id_apartado}Dropdown`);
                                if (dropdown) {
                                  dropdown.classList.remove('show');
                                  dropdown.setAttribute('aria-expanded', 'false');
                                }
                                const menu = dropdown?.nextElementSibling;
                                if (menu) {
                                  menu.classList.remove('show');
                                }
                              }}
                            >
                              {cat.nombre_categoria}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </li>
                ) : (
                  <li className="nav-item custom-header__navItem" key={apartado.id_apartado}>
                    <Link 
                      className="nav-link custom-header__navLink" 
                      to={getRouteForApartado(apartado)}
                    >
                      {apartado.nombre_apartado}
                    </Link>
                  </li>
                )
              ))}

              {/* Menú Nosotros condicional - SOLO si hay apartados especiales */}
              {apartadosNosotros.length > 0 && (
                <li className="nav-item dropdown custom-header__navItem">
                  <a
                    className="nav-link dropdown-toggle custom-header__navLink"
                    href="#"
                    id="nosotrosDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Nosotros
                  </a>
                  <ul className="dropdown-menu custom-header__dropdownMenu" aria-labelledby="nosotrosDropdown">
                    {apartadosNosotros.map(apartado => (
                      <li key={apartado.id_apartado}>
                        <Link
                          className="dropdown-item custom-header__dropdownItem"
                          to={getRouteForApartado(apartado)}
                          onClick={() => {
                            const dropdown = document.getElementById('nosotrosDropdown');
                            if (dropdown) {
                              dropdown.classList.remove('show');
                              dropdown.setAttribute('aria-expanded', 'false');
                            }
                            const menu = dropdown?.nextElementSibling;
                            if (menu) {
                              menu.classList.remove('show');
                            }
                          }}
                        >
                          {apartado.nombre_apartado}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>

            <div className="custom-header__actions d-flex flex-column flex-md-row gap-2">
              <button className="btn btn-sm custom-header__btnLogin" onClick={onLogin}>
                Acceder
              </button>
              <button className="btn btn-sm custom-header__btnStart" onClick={onStart}>
                Empezar
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;