import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Plan {
  id_plan: string;
  nombre_plan: string;
  descripcion_plan: string | null;
  precio_plan: string; // Convertiremos a number después
  whatsapp_incluidos: number;
  emails_incluidos: number;
  acceso_api: boolean;
  max_clientes: number | null;
  stripe_price_id: string | null;
  paypal_plan_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

// GET /allplans/ - Obtener todos los planes
export const getAllPlans = (): Promise<AxiosResponse<Plan[]>> => 
  api.get('/allplans/');

// GET /planbyid/:id - Obtener plan por ID
export const getPlanById = (id: string): Promise<AxiosResponse<Plan>> => 
  api.get(`/planbyid/${id}`);

// POST / - Crear nuevo plan
export const createPlan = (data: Omit<Plan, 'id_plan' | 'creado_en' | 'actualizado_en'>): Promise<AxiosResponse<Plan>> => 
  api.post('/', data);

// PUT /utdplan/:id - Actualizar plan por ID
export const updatePlan = (id: string, data: Partial<Omit<Plan, 'id_plan' | 'creado_en'>>): Promise<AxiosResponse<Plan>> => 
  api.put(`/utdplan/${id}`, data);

// DELETE /delplan/:id - Eliminar plan por ID
export const deletePlan = (id: string): Promise<AxiosResponse<void>> => 
  api.delete(`/delplan/${id}`);