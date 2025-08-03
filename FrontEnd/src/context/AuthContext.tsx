import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loginRequest, logoutRequest, verifyRequest } from '../api/auth';
import type { LoginData, User } from '../types/auth';
import Cookies from "js-cookie"

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signin: (data: LoginData) => Promise<void>;
  logout: () => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      console.log('Intentando verificar autenticación...');
      try {
        const res = await verifyRequest();
        console.log('Verify exitoso:', res.data);
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (error: any) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  const signin = async (data: LoginData) => {
    const res = await loginRequest(data);
    const userData = res.data;
    
    setUser(userData);
    setIsAuthenticated(true);

    // Redirección simple sin delays
    if (userData.rol === 'admin') {
      window.location.href = '/admin';
    } else if (userData.rol === 'inquilino') {
      // SIEMPRE ir a dashboard, ProtectedRoute decidirá si redirigir a planes
      window.location.href = '/tenant/dashboard';
    }
  };

  const logout = () => {
    logoutRequest().catch(error => {
      console.error('Error en logout endpoint:', error);
    });
    
    Cookies.remove('token');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, signin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}