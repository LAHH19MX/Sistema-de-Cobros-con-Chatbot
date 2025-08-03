import api from './axios';

export interface DatosGrafica {
  periodo: string;
  rango: {
    desde: string;
    hasta: string;
  };
  totales: {
    ingresoTotal: number;
    cantidadPagos: number;
    promedioMensual: number;
  };
  datos: Array<{
    periodo: string;
    total: number;
    cantidad: number;
    promedio: number;
  }>;
}

export interface PagoCompletado {
  id_pago: string;
  cliente: {
    nombreCompleto: string;
    email: string;
  };
  deuda: {
    descripcion: string;
    montoOriginal: number;
  };
  pago: {
    fechaPago: string;
    importe: number;
    referencia: string;
    concepto: string;
    observaciones: string;
  };
}

export interface PagosResponse {
  data: PagoCompletado[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReporteIngresos {
  empresa: {
    nombre: string;
    logo: string;
  } | null;
  inquilino: string;
  fechaGeneracion: string;
  periodo: {
    desde: string;
    hasta: string;
  };
  resumen: {
    totalPagos: number;
    totalIngresos: number;
  };
  datos: Array<{
    nombreCompleto: string;
    email: string;
    metodo: string;
    descripcion: string;
    fechaPago: string;
    montoNeto: number;
  }>;
}

// Obtener datos para gráfica
export const getIngresosGrafica = (params: {
  periodo: 'mensual' | 'trimestral' | 'anual';
  año?: number;
  mes?: number;
}) => api.get<DatosGrafica>('/tenant/ingresos/grafica', { params });

// Obtener pagos completados
export const getPagosCompletados = (params?: {
  desde?: string;
  hasta?: string;
  id_cliente?: string;
  page?: number;
  limit?: number;
}) => api.get<PagosResponse>('/tenant/ingresos/pagos', { params });

// Generar reporte
export const generarReporteIngresos = (params: {
  desde: string;
  hasta: string;
  id_cliente?: string;
}) => api.get<ReporteIngresos>('/tenant/ingresos/reporte', { params });