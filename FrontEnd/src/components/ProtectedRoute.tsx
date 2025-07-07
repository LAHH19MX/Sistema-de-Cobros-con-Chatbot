// src/components/ProtectedRoute.tsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner.tsx';

export default function ProtectedRoute({ allowed }: { allowed: string[] }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowed.includes(user!.rol)) return <Navigate to="/error404" replace />;
  return <Outlet />;
}
