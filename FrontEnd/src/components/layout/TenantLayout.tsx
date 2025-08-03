import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { initializeSocket, disconnectSocket } from '../../config/socket'; // NUEVO

import SideBarTenant from '../layout/SideBarTenant';
import HeaderTenant   from '../layout/HeaderTenant';
import FooterTenant   from '../layout/FooterTenant';

import { useAuth } from '../../context/AuthContext';
import '../../styles/tenant/TenantLayout.css';   

const TenantLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate        = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('Inquilino autenticado - Conectando Socket.io...')
    initializeSocket()
    
    return () => {
      console.log('Desconectando Socket.io...')
      disconnectSocket()
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)');
    const handler = (e: MediaQueryList | MediaQueryListEvent) =>
      setIsSidebarOpen(e.matches);
    handler(mq);                     
    mq.addEventListener
      ? mq.addEventListener('change', handler)
      : mq.addListener(handler);
    return () =>
      mq.removeEventListener
        ? mq.removeEventListener('change', handler)
        : mq.removeListener(handler);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);
  const handleLogout  = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`tenant-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <SideBarTenant
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />

      {/* contenedor vertical flex */}
      <div className="tenant-main">
        <HeaderTenant
          toggleSidebar={toggleSidebar}
          userName={user?.nombre ?? ''}
          onLogout={handleLogout}
        />

        {/* wrapper que empuja el footer */}
        <div className="tenant-content">
          <Outlet />
        </div>

        <FooterTenant />
      </div>
    </div>
  );
};

export default TenantLayout;
