import api from './axios';

export interface DashboardStats {
  totalClientes: number;
  totalCobrado: number;
  deudasPendientes: number;
}

export interface EnlacePago {
  nombre: string;
  fecha: string;
  referencia: string;
  estado: string;
  concepto: string;
  monto: number;
}

// Obtener estadísticas del dashboard
export const getDashboardStats = () =>
  api.get<DashboardStats>('/tenant/dashboard/stats');

// Obtener últimos enlaces
export const getUltimosEnlaces = () =>
  api.get<EnlacePago[]>('/tenant/dashboard/ultimos-enlaces');