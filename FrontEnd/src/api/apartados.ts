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

// 1. GET /apartados Trae todos los apartados
export const getAllApartados = (): Promise<AxiosResponse<Apartado[]>> => 
  api.get('/apartados');

// 2. GET /apartado/:id Trae a un apartado por su id
export const getApartado = (id: string): Promise<AxiosResponse<Apartado>> => 
  api.get(`/apartado/${id}`);

// 3. POST /apartadoCre Crea un apartado 
export const createApartado = (data: {
  nombre_apartado: string;
  id_empresa: string;
  id_plantilla: string;
  activo_apartado?: boolean;
  mostrar_categoria?: boolean;
}): Promise<AxiosResponse<Apartado>> => 
  api.post('/apartadoCre', data);

// 4. PUT /apartadoUpd/:id Actualiza a un apartado por su id
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

// 5. DELETE /apartadoDel/:id Elimina a un apartado por su id
export const deleteApartado = (id: string): Promise<AxiosResponse<void>> => 
  api.delete(`/apartadoDel/${id}`);