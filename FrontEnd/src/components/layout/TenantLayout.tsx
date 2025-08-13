import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { initializeSocket, disconnectSocket } from '../../config/socket';
import { getPerfil } from '../../api/settingsTenant'; 

import SideBarTenant from '../layout/SideBarTenant';
import HeaderTenant   from '../layout/HeaderTenant';
import FooterTenant   from '../layout/FooterTenant';

import { useAuth } from '../../context/AuthContext';
import '../../styles/tenant/TenantLayout.css';   

const TenantLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate        = useNavigate();
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined); 

  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const response = await getPerfil();
        if (response.data.foto_inquilino) {
          setUserPhoto(response.data.foto_inquilino);
        }
      } catch (error) {
        console.error('Error obteniendo foto de perfil:', error);
      }
    };
    
    fetchUserPhoto();
    
    initializeSocket();
    
    return () => {
      disconnectSocket();
    }
  }, []);

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      <div className="tenant-main">
        <HeaderTenant
          toggleSidebar={toggleSidebar}
          userName={user?.nombre ?? ''}
          userPhoto={userPhoto}
          onLogout={handleLogout}
        />

        <div className="tenant-content">
          <Outlet />
        </div>

        <FooterTenant />
      </div>
    </div>
  );
};

export default TenantLayout;