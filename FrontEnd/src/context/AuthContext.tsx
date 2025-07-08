// AuthContext.tsx
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
  logout: () => void; // Cambié de signout a logout
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
        console.error('Error en verify:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
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
    setUser(res.data);
    setIsAuthenticated(true);
  };

  // Una sola función logout que hace todo
  const logout = () => {
    // Intentar llamar al endpoint de logout (opcional)
    logoutRequest().catch(error => {
      console.error('Error en logout endpoint:', error);
    });
    
    // Limpiar todo localmente
    Cookies.remove('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, signin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}