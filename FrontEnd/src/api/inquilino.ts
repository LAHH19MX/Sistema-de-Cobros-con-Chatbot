import api from './axios';
import type { AxiosResponse } from 'axios';

export interface InquilinoListado {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  email: string;
  telefono?: string;
  estado: boolean;
  fecha_registro: string;
  foto?: string;
  suscripcion?: {
    estado: string;
    fecha_inicio: string;
    fecha_renovacion: string;
    plan: {
      nombre: string;
      precio: string;
    };
  };
}

export interface InquilinoDetalle extends Omit<InquilinoListado, 'id'> {
  id_inquilino: string;
  direccion?: string;
  suscripcion?: {
    estado: string;
    fecha_inicio: string;
    fecha_renovacion: string;
    plan: {
      id_plan: string;
      nombre: string;
      descripcion?: string;
      precio: string;
    };
  };
}

export interface UpdateInquilinoInput {
  nombre_inquilino?: string;
  apellido_paterno?: string;
  apellido_materno?: string | null;
  email_inquilino?: string;
  telefono_inquilino?: string | null;
  direccion_inquilino?: string | null;
  estado_inquilino?: boolean;
  foto_inquilino?: string | null;
  plan_id?: string;
  estado_suscripcion?: string;
  fecha_renovacion?: string;
}

// Operaciones API
export const getAllInquilinos = (): Promise<AxiosResponse<InquilinoListado[]>> => 
  api.get('/tenantplans'); // Cambiar de /inquilinos a /tenantplans

export const getInquilinoById = (id: string): Promise<AxiosResponse<InquilinoDetalle>> => 
  api.get(`/tenantplan/${id}`); // Cambiar de /inquilinos/${id} a /tenantplan/${id}

export const updateInquilino = (id: string, data: UpdateInquilinoInput): Promise<AxiosResponse<InquilinoDetalle>> => 
  api.put(`/utdtenant/${id}`, data);  