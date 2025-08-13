import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Apartado {
  id_apartado: string;
  nombre_apartado: string;
  id_empresa: string;
  id_plantilla: string;
  activo_apartado: boolean;
  mostrar_categoria: boolean;
  fecha_creacion?: string;
}

// rae todos los apartados
export const getAllApartados = (): Promise<AxiosResponse<Apartado[]>> => 
  api.get('/apartados');

// Trae a un apartado por su id
export const getApartado = (id: string): Promise<AxiosResponse<Apartado>> => 
  api.get(`/apartado/${id}`);

// Crea un apartado 
export const createApartado = (data: {
  nombre_apartado: string;
  id_empresa: string;
  id_plantilla: string;
  activo_apartado?: boolean;
  mostrar_categoria?: boolean;
}): Promise<AxiosResponse<Apartado>> => 
  api.post('/apartadoCre', data);

// Actualiza a un apartado por su id
export const updateApartado = (
  id: string,
  data: {
    nombre_apartado: string;
    id_empresa: string;
    id_plantilla: string;
    activo_apartado?: boolean;
    mostrar_categoria?: boolean;
  }
): Promise<AxiosResponse<Apartado>> => 
  api.put(`/apartadoUpd/${id}`, data);

// Elimina a un apartado por su id
export const deleteApartado = (id: string): Promise<AxiosResponse<void>> => 
  api.delete(`/apartadoDel/${id}`);