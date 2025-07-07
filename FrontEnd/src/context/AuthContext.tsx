// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';
import { loginRequest, logoutRequest } from '../api/auth';
import type { LoginData, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signin: (data: LoginData) => Promise<void>;
  signout: () => Promise<void>;
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

  // Al montar, lee la cookie y decodifica el JWT manualmente
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const base64Payload = token.split('.')[1];
        const payloadJson   = atob(base64Payload);
        const payload: User = JSON.parse(payloadJson);
        setUser(payload);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  const signin = async (data: LoginData) => {
    setLoading(true);
    await loginRequest(data);
    const token = Cookies.get('token');
    if (token) {
      try {
        const base64Payload = token.split('.')[1];
        const payloadJson   = atob(base64Payload);
        const payload: User = JSON.parse(payloadJson);
        setUser(payload);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  const signout = async () => {
    setLoading(true);
    await logoutRequest();
    Cookies.remove('token');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
}
