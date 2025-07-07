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