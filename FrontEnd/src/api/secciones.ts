import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Seccion {
  id_seccion: string;
  titulo_seccion: string;
  texto_seccion: string;
  imagen_url: string;
  activo_seccion: boolean;
  tipo_seccion: string;
  fecha_creacion?: string;
  id_categoria: string;
}

// Obtiene a todas las secciones por su categoria
export const getSeccionesByCategoria = (categoriaId: string): Promise<AxiosResponse<Seccion[]>> =>
  api.get(`/secciones/${categoriaId}`);

// Obtiene a una seccion por su id
export const getSeccionById = (id: string): Promise<AxiosResponse<Seccion>> =>
  api.get(`/seccion/${id}`);

// Crea una seccion, apartir del id de la categoria que pretenecera
export const createSeccion = (
  categoriaId: string,
  data: {
    titulo_seccion: string;
    texto_seccion: string;
    imagen_url: string;
    activo_seccion?: boolean;
    tipo_seccion?: string;
  }
): Promise<AxiosResponse<Seccion>> =>
  api.post(`/seccionCre/${categoriaId}`, data);

// Actualiza a una seccion apartir de su id
export const updateSeccion = (
  id: string,
  data: {
    titulo_seccion: string;
    texto_seccion: string;
    imagen_url: string;
    activo_seccion?: boolean;
    tipo_seccion?: string;
  }
): Promise<AxiosResponse<Seccion>> =>
  api.put(`/seccionUpd/${id}`, data);

// Elimina a una seccion apartir de su id
export const deleteSeccion = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/seccionDel/${id}`);