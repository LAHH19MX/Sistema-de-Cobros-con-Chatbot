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

export interface MorosoDetalle {
  cliente: {
    id_cliente: string;
    nombre_cliente: string;
    apellido_paterno: string;
    apellido_materno: string;
    email_cliente: string;
    telefono_cliente: string;
    nombreCompleto: string;
  };
  resumen: {
    cantidadDeudas: number;
    montoTotal: number;
    diasRetrasoPromedio: number;
  };
  deudas: Array<{
    id_deuda: string;
    descripcion: string;
    monto_original: number;
    saldo_pendiente: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado_deuda: string;
    diasRetraso: number;
  }>;
}

export interface ReporteMorosos {
  empresa: {
    nombre: string;
    logo: string;
  } | null;
  inquilino: {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  };
  fechaGeneracion: string;
  datos: Array<{
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email: string;
    fechaEmision: string;
    fechaVencimiento: string;
    diasRetraso: number;
    monto: number;
  }>;
}

// Listar morosos con filtros
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
  api.get<MorosoDetalle>(`/tenant/morosos/${id}`);

// Enviar notificación a moroso
export const enviarNotificacionMoroso = (id: string) =>
  api.post(`/tenant/morosos/${id}/notificar`);

// Generar reporte de morosos
export const generarReporteMorosos = (params: {
  desde?: string;
  hasta?: string;
  dias_retraso?: number;
  monto_min?: number;
  monto_max?: number;
  id_cliente?: string;
}) => api.get<ReporteMorosos>('/tenant/moroso/reporte', { params });