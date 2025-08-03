import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import  { SiteDataProvider }  from './context/SiteDataContext.tsx';
import { ContentProvider } from './context/ContentContext.tsx';
import { CompanyProvider } from './context/CompanyContext.tsx';
import { InquilinosProvider } from './context/TenantsContext';

import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';

import CategoriaPage  from './pages/site/CategoriaPage.tsx';
import ViewBlogPage  from './pages/site/ViewBlogPage.tsx';

import SiteLayout from './components/layout/SiteLayout.tsx';

// //Para acomodar la vista de los componentes de admin
import AdminLayout from './components/layout/AdminLayout.tsx';
import AdminDashboard from './pages/admin/AdminDashboard';

// //Para acomodar la vista de los componentes de inquilino
import TenantLayout from './components/layout/TenantLayout.tsx';
import PlanesPage from './pages/tenant/PlanesPage.tsx';
import ExitoPage from './pages/tenant/ExitoPage.tsx'
import CancelarPage from './pages/tenant/CancelarPage.tsx'

import DynamicPage from './pages/site/DymanicPage';
import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage      from './pages/auth/RegisterPage.tsx';
// import ResetPasswordPage from './pages/auth/ResetPasswordPage.tsx';
import Error404          from './pages/Error404.tsx';
import { PlansProvider } from './context/PlansContext.tsx';
import DashboardTenant from './pages/tenant/DashboardTenant.tsx';
import ClientesTenant from './pages/tenant/ClientesTenant.tsx';
import DeudasTenant from './pages/tenant/DeudasTenant.tsx';
import MorososTenant from './pages/tenant/ClientesMorosos.tsx';
import IngresosTenant from './pages/tenant/IngresosTenant.tsx';
import UpdateClient from './pages/tenant/UpdateClient.tsx';
import AddClient from './pages/tenant/AddClient.tsx';
import AddDeuda from './pages/tenant/AddDeuda.tsx';
import UpdateDeuda from './pages/tenant/UpdateDeuda.tsx';
import ConfiguracionPage from './pages/tenant/ConfiguracionPerfil.tsx';
import PerfilTenant from './pages/tenant/PerfilTenant.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
        <CompanyProvider>
          <SiteDataProvider>
            <PlansProvider>
              <InquilinosProvider> 
                <ContentProvider>                       
                  <Routes>

                    {/* 1. Solo invitados pueden ver el sitio */}
                    <Route element={<GuestRoute />}>
                      <Route path="/" element={<SiteLayout />}>
                        <Route index element={<DynamicPage slug="inicio" />} />
                        <Route path="categoria/:id" element={<CategoriaPage />} />
                        <Route path="blog/:id" element={<ViewBlogPage />} />
                          <Route path="nosotros" element={<DynamicPage slug="nosotros" />} />
                          <Route path="faq" element={<DynamicPage slug="faq" />} />
                          <Route path="terminos" element={<DynamicPage slug="terminos" />} />
                          <Route path="politicas" element={<DynamicPage slug="politicas" />} />
                        <Route path=":slug" element={<DynamicPage />} />
                      </Route>
                    </Route>

                    {/* 2. Login / Registro / Restablecer */}
                    <Route path="/login"      element={<LoginPage />} />
                    <Route path="/register"   element={<RegisterPage />} />
                    {/* <Route path="/restablecer" element={<ResetPasswordPage />} /> */}

                    {/* 3. Panel de Admin */}
                    <Route element={<ProtectedRoute allowed={['admin']} />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="planes" element={<PlanesPage />} />
                        <Route path="clientes" element={<div>Página de Clientes</div>} />
                        <Route path="suscripciones" element={<div>Página de Suscripciones</div>} />
                        <Route path="ingresos" element={<div>Página de Ingresos</div>} />
                        <Route path="contenido/inicio" element={<div>Gestión de Inicio</div>} />
                        <Route path="contenido/blog" element={<div>Gestión de Blog</div>} />
                        <Route path="contenido/faq" element={<div>Gestión de FAQ</div>} />
                        <Route path="contenido/myv" element={<div>Gestión de MyV</div>} />
                        <Route path="contenido/nuevo" element={<div>Nuevo Apartado</div>} />
                        <Route path="perfil" element={<div>Perfil Admin</div>} />
                        <Route path="configuracion" element={<div>Configuración</div>} />
                      </Route>
                    </Route>

                    {/* 4. Panel de Tenant */}
                    <Route element={<ProtectedRoute allowed={['inquilino']} />}>
                      <Route path="/tenant" element={<TenantLayout />}>
                        <Route path="planes" element={<PlanesPage />} />
                        <Route element={<ProtectedRoute allowed={['inquilino']} requiresSubscription={true} />}>
                          <Route path="perfil" element={<PerfilTenant />} />
                          <Route path="configuracion" element={<ConfiguracionPage />} />
                          <Route path="dashboard" element={<DashboardTenant />} />
                          <Route path="clientes/morosos" element={<MorososTenant />} />
                          <Route path="ingresos" element={<IngresosTenant />  } />
                          <Route path="clientes" element={<ClientesTenant />} />
                          <Route path="clientes/nuevo" element={<AddClient />} />
                          <Route path="clientes/editar/:id" element={<UpdateClient/>} />
                          <Route path="deudas" element={<DeudasTenant />} />
                          <Route path="deudas/nueva" element={<AddDeuda />} />
                          <Route path="deudas/editar/:id" element={<UpdateDeuda />} />
                          <Route path="suscripcion/exito" element={<ExitoPage />} />
                          <Route path="suscripcion/cancelar" element={<CancelarPage />} />
                        </Route>
                      </Route>
                    </Route>

                    {/* 5. Cualquier otra ruta */}
                    <Route path="*" element={<Error404 />} />
                  </Routes> 
                </ContentProvider>
              </InquilinosProvider>   
            </PlansProvider>     
          </SiteDataProvider>
        </CompanyProvider>
      </BrowserRouter>  
    </AuthProvider>
  );
}
