import apiClient from "./axios"

export interface Plan {
  id_plan: string;
  nombre_plan: string;
  descripcion_plan: string | null;
  precio_plan: number;
  limites_whatsapp: number;
  limites_email: number;
  limites_api: boolean;
  limites_clientes: number | null;
  stripe_price_id: string | null;
  paypal_plan_id: string | null;
}

export interface PlanesResponse {
  success: boolean;
  planes: Plan[];
}

export interface CheckoutRequest {
  planId: string;
  gateway: 'stripe' | 'paypal';
}

export interface CheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  message?: string;
  plan?: {
    id: string;
    nombre: string;
    precio: number;
  };
}

// Obtener todos los planes activos
export const getPlanes = async (): Promise<PlanesResponse> => {
  const response = await apiClient.get('/allplans');
  return response.data;
};

// Crear checkout de suscripción
export const createCheckout = async (data: CheckoutRequest): Promise<CheckoutResponse> => {
  const response = await apiClient.post('/subscriptions/checkout', data);
  return response.data;
};