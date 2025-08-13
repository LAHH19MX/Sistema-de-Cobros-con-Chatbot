import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import type { FooterSection } from './Footer';
import { useSiteData } from '../../context/SiteDataContext';
import { useCompany } from '../../context/CompanyContext';

const SiteLayout: React.FC = () => {
  const navigate = useNavigate();
  const { loadApartados, apartados, categorias, loadCategorias } = useSiteData();
  const { empresa, redes, loadEmpresa, loadRedes } = useCompany();
  const handleLogin = () => navigate('/login');
  const handleStart = () => navigate('/register');
  const hasLoadedCategories = useRef(false);
  
  useEffect(() => {
    const loadInitialData = async () => {
      await loadApartados();
      await loadEmpresa('7c4fe9f1-b602-46c5-8ac3-2021cfe7245d'); // Tu ID de empresa
      await loadRedes();
    };
    
    loadInitialData();
  }, []);

  // Cargar categorías de TODOS los apartados cuando se carguen los apartados
  useEffect(() => {
    const loadAllCategorias = async () => {
      if (hasLoadedCategories.current) return;
      
      hasLoadedCategories.current = true;
      for (const apartado of apartados) {
        await loadCategorias(apartado.id_apartado);
      }
    };

    if (apartados.length > 0 && !hasLoadedCategories.current) {
      loadAllCategorias();
    }
  }, [apartados]);

  // Preparar datos para el Footer
  const footerSections: FooterSection[] = apartados
    .filter(apartado => apartado.activo_apartado && apartado.mostrar_categoria)
    .map(apartado => ({
      title: apartado.nombre_apartado,
      links: categorias
        .filter(cat => cat.id_apartado === apartado.id_apartado && cat.activo_categoria)
        .map(cat => ({
          name: cat.nombre_categoria,
          url: `/categoria/${cat.id_categoria}`
        }))
    }))
    .filter(section => section.links.length > 0); // Solo mostrar secciones con enlaces

  // Preparar sección "Términos y Políticas" para el footer
  const apartadosTerminosYPoliticas = apartados.filter(apartado => 
    apartado.activo_apartado &&
    ['d06799f2-5a41-49e4-bc6e-b71ef25460fd', '67537c80-0fcb-45d5-863b-ca8c2ce32d53']
      .includes(apartado.id_plantilla)
  );

  // Función para obtener la ruta correcta según la plantilla de términos/políticas
  const getRouteForTerminosYPoliticas = (apartado: any) => {
    switch(apartado.id_plantilla) {
      case 'd06799f2-5a41-49e4-bc6e-b71ef25460fd':
        return '/terminos';
      case '67537c80-0fcb-45d5-863b-ca8c2ce32d53':
        return '/politicas';
      default:
        return `/${apartado.nombre_apartado.toLowerCase()}`;
    }
  };

  // Agregar sección de Términos y Políticas si existen apartados
  const allFooterSections = [...footerSections];
  if (apartadosTerminosYPoliticas.length > 0) {
    allFooterSections.push({
      title: 'Términos y Políticas',
      links: apartadosTerminosYPoliticas.map(apartado => ({
        name: apartado.nombre_apartado,
        url: getRouteForTerminosYPoliticas(apartado)
      }))
    });
  }

  // Preparar dirección
  const addressLines = empresa ? [
    empresa.nombre_empresa,
    empresa.calle_empresa ? `${empresa.calle_empresa}, ${empresa.colonia_empresa || ''}` : '',
    empresa.ciudad_empresa ? `${empresa.ciudad_empresa}, ${empresa.estado_empresa || ''} ${empresa.codigo_postal_empresa || ''}` : '',
    empresa.telefono_empresa || '',
    empresa.email_empresa
  ].filter(line => line) : [];

  // Preparar URL del mapa
  const mapUrl = empresa && empresa.latitud_empresa && empresa.longitud_empresa
    ? `https://www.google.com/maps?q=${empresa.latitud_empresa},${empresa.longitud_empresa}`
    : '#';

  // Preparar redes sociales
  const socialLinks = redes.map(red => ({
    url: red.enlace,
    iconClass: getIconClass(red.logo_red || red.nombre_red)
  }));

  // Copyright con año actual
  const currentYear = new Date().getFullYear();
  const copyright = empresa 
    ? `© ${currentYear} ${empresa.nombre_empresa}. Todos los derechos reservados.`
    : `© ${currentYear} Todos los derechos reservados.`;

  return (
    <div className="site-layout d-flex flex-column min-vh-100">
      <Header
        onLogin={handleLogin}
        onStart={handleStart}
      />
      <main className="site-layout__main flex-grow-1">
        <Outlet />
      </main>
      <Footer
        sections={allFooterSections}
        addressLines={addressLines}
        mapUrl={mapUrl}
        socialLinks={socialLinks}
        copyright={copyright}
      />
    </div>
  );
};

// Función auxiliar para mapear iconos
function getIconClass(socialName: string): string {
  const iconMap: Record<string, string> = {
    'facebook': 'fab fa-facebook-f',
    'twitter': 'fab fa-twitter',
    'instagram': 'fab fa-instagram',
    'youtube': 'fab fa-youtube',
    'linkedin': 'fab fa-linkedin-in',
    'tiktok': 'fab fa-tiktok',
    'whatsapp': 'fab fa-whatsapp',
  };
  
  return iconMap[socialName.toLowerCase()] || `fab fa-${socialName.toLowerCase()}`;
}

export default SiteLayout;