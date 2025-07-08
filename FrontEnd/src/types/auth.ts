//Login
export interface LoginData {
  email: string;
  contra: string;
}

// lo que guarda el jtw
export interface User {
  id: string;
  nombre: string;
  rol: 'admin' | 'tenant';
}

// src/types/auth.ts
export interface LoginData {
  email: string;
  contra: string;
}

export interface User {
  id: string;
  rol: 'admin' | 'tenant';
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  email: string;
}