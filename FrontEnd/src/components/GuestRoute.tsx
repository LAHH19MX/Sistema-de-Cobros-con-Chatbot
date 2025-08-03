// src/components/GuestRoute.tsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner.tsx';

export default function GuestRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Spinner />;
  if (isAuthenticated) {
    return user!.rol === 'admin'
      ? <Navigate to="/admin" replace />
      : <Navigate to="/tenant/planes" replace />
  }
  return <Outlet />; 
}
