import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner.tsx';

interface ProtectedRouteProps {
  allowed: string[];
  requiresSubscription?: boolean; 
}

export default function ProtectedRoute({ 
  allowed, 
  requiresSubscription = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowed.includes(user!.rol)) return <Navigate to="/error404" replace />;
  
  // NUEVA LÓGICA: Verificar suscripción para inquilinos
  if (requiresSubscription && user!.rol === 'inquilino' && !user!.hasSubscription) {
    return <Navigate to="/tenant/planes" replace />;
  }
  
  return <Outlet />;
}