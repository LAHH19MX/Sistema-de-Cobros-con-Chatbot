import api from './axios';

export interface Deuda {
  id_deuda: string;
  monto_original: number;
  saldo_pendiente: number;
  descripcion: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado_deuda: string;
  tasa_interes: number;
  id_cliente: string;
  Cliente?: {
    nombre_cliente: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email_cliente: string;
    telefono_cliente?: string;
  };
}

export interface DeudasResponse {
  data: Deuda[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WidgetsDeudas {
  pendientes: number;
  pagadas: number;
  vencidas: number;
}

export interface ReporteDeudas {
  empresa: {
    nombre: string;
    logo: string;
  } | null;
  inquilino: string;
  fechaGeneracion: string;
  datos: Array<{
    nombreCompleto: string;
    email: string;
    descripcion: string;
    fechaEmision: string;
    fechaVencimiento: string;
    monto: number;
    pagado: number;
    estado: string;
  }>;
}

// Widgets de deudas
export const getWidgetsDeudas = () =>
  api.get<WidgetsDeudas>('/tenant/deudas/widgets');

// Listar deudas
export const getDeudas = (params?: { page?: number; limit?: number }) =>
  api.get<DeudasResponse>('/tenant/deudas', { params });

// Obtener deuda por ID
export const getDeudaById = (id: string) =>
  api.get<Deuda>(`/tenant/deudas/${id}`);

// Crear deuda
export const createDeuda = (data: {
  monto_original: number;
  descripcion: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  id_cliente: string;
}) => api.post<Deuda>('/tenant/deudas', data);

// Actualizar deuda
export const updateDeuda = (id: string, data: {
  monto_original?: number;
  saldo_pendiente?: number;
  descripcion?: string;
  fecha_vencimiento?: string;
  estado_deuda?: string;
}) => api.put<Deuda>(`/tenant/deudas/${id}`, data);

// Generar reporte
export const generarReporteDeudas = (params: {
  desde: string;
  hasta: string;
  estado?: string;
  id_cliente?: string;
}) => api.get<ReporteDeudas>('/tenant/deudas/reporte', { params });