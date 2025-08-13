import apiClient from "./axios";

export interface SubscriptionPlan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  limites: {
    whatsapp: number;
    email: number;
    clientes: number | null;
    api: boolean;
  };
}

export interface ResourceUsage {
  usado: number;
  limite: number;
  porcentaje: number;
}

export interface ApiResource {
  usado: number;
  acceso: boolean;
  mensaje: string;
}

export interface SubscriptionResources {
  whatsapp: ResourceUsage;
  email: ResourceUsage;
  clientes: ResourceUsage;
  api: ApiResource;
}

// Interface para plan siguiente
export interface NextPlan {
  id: string;
  nombre: string;
  precio: number;
  fechaCambio: string;
  mensaje: string;
}

export interface Subscription {
  id: string;
  estado: 'activa' | 'cancelada' | 'vencida' | 'periodo_gracia';
  mensaje: string;
  fechaInicio: string;
  fechaRenovacion: string;
  fechaCancelacion: string | null;
  pasarela: 'stripe' | 'paypal';
  diasRestantes: number;
  enPeriodoGracia: boolean;
  plan: SubscriptionPlan;
  planSiguiente?: NextPlan | null;
  recursos: SubscriptionResources | null;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  hasSubscription: boolean;
  message?: string;
  subscription?: Subscription;
}

export interface ResourceData {
  usado: number;
  limite: number | string;
  restante: number;
  porcentaje: number;
  status: 'normal' | 'advertencia' | 'critico' | 'agotado' | 'disponible' | 'bloqueado';
  descripcion: string;
}

export interface ResourcesResponse {
  success: boolean;
  message?: string;
  plan?: {
    id: string;
    nombre: string;
    precio: number;
  };
  periodo?: {
    fechaInicio: string;
    fechaRenovacion: string;
    diasHastaReset: number;
    mensaje: string;
  };
  recursos?: {
    whatsapp: ResourceData;
    email: ResourceData;
    clientes: ResourceData;
    api: ResourceData;
  };
  resumen?: {
    estado: 'bueno' | 'advertencia' | 'critico';
    mensaje: string;
    ultimaActualizacion: string;
    recursosAgotados: number;
    recursosCriticos: number;
  };
  recomendaciones?: string[];
}

// Interface de cancelación
export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: {
    id: string;
    estado: string;
    fechaCancelacion: string;
    fechaFinAcceso: string;
    accesoDias: number;
    mensajeAcceso: string;
    plan: {
      nombre: string;
      precio: number;
    };
  };
  warnings?: string[];
}

export interface ChangePlanRequest {
  planId: string;
  gateway: 'stripe' | 'paypal';
}

// Interface de cambio de plan
export interface ChangePlanResponse {
  success: boolean;
  message: string;
  subscription?: {
    id: string;
    // ombres que coinciden con el backend
    planActual: string;
    planNuevo: string;
    precioActual: number; 
    precioNuevo: number;
    fechaCambio: string; 
    mensaje: string;
  };
  error?: any;
}

// Obtener estado de la suscripción
export const getSubscriptionStatus = async (): Promise<SubscriptionStatusResponse> => {
  const response = await apiClient.get('/subscriptions/status');
  return response.data;
};

// Obtener uso de recursos
export const getResourceUsage = async (): Promise<ResourcesResponse> => {
  const response = await apiClient.get('/subscriptions/resources');
  return response.data;
};

// Cancelar suscripción
export const cancelSubscription = async (): Promise<CancelSubscriptionResponse> => {
  const response = await apiClient.post('/subscriptions/cancel');
  return response.data;
};

// Cambiar plan de suscripción
export const changePlan = async (data: ChangePlanRequest): Promise<ChangePlanResponse> => {
  const response = await apiClient.post('/subscriptions/change-plan', data);
  return response.data;
};