import api from './axios';

export interface ClienteMoroso {
  cliente: {
    id_cliente: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
  };
  cantidadDeudas: number;
  montoTotal: number;
  diasRetrasoMaximo: number;
  deudas: Array<{
    id_deuda: string;
    descripcion: string;
    monto: number;
    fechaVencimiento: string;
    diasRetraso: number;
  }>;
}

export interface MorososResponse {
  data: ClienteMoroso[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReporteMorosos {
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
    diasRetraso: number;
    monto: number;
  }>;
}

// Listar morosos
export const getMorosos = (params?: {
  page?: number;
  limit?: number;
  dias_retraso?: number;
  monto_min?: number;
  monto_max?: number;
  id_cliente?: string;
}) => api.get<MorososResponse>('/tenant/morosos', { params });

// Obtener moroso por ID
export const getMorosoById = (id: string) =>
  api.get(`/tenant/morosos/${id}`);

// Enviar notificación
export const enviarNotificacionMoroso = (id: string) =>
  api.post(`/tenant/morosos/${id}/notificar`);

// Generar reporte
export const generarReporteMorosos = (params: {
  desde?: string;
  hasta?: string;
  dias_retraso?: number;
  monto_min?: number;
  monto_max?: number;
  id_cliente?: string;
}) => api.get<ReporteMorosos>('/tenant/morosos/reporte', { params });