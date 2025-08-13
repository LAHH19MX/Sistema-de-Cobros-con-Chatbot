import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Categoria {
  id_categoria: string;
  nombre_categoria: string;
  titulo_categoria: string;
  texto_categoria: string;
  imagen_categoria: string;
  activo_categoria: boolean;
  fecha_creacion?: string;
  id_apartado: string;
}

// rae a todas las categorias apartir del apartado al que pertenece
export const getCategoriasByApartado = (apartadoId: string): Promise<AxiosResponse<Categoria[]>> =>
  api.get(`/categorias/${apartadoId}`);

// Trae a una categoria apartir de su id
export const getCategoriaById = (id: string): Promise<AxiosResponse<Categoria>> =>
  api.get(`/categoria/${id}`);

// Crea una categoria pasando el id del apartado al que pertenecera
export const createCategoria = (
  apartadoId: string,
  data: {
    nombre_categoria: string;
    titulo_categoria: string;
    texto_categoria: string;
    imagen_categoria: string;
    activo_categoria?: boolean;
  }
): Promise<AxiosResponse<Categoria>> =>
  api.post(`/categoriaCre/${apartadoId}`, data);

// Actualiza a una categoria apartir de su id
export const updateCategoria = (
  id: string,
  data: {
    nombre_categoria: string;
    titulo_categoria: string;
    texto_categoria: string;
    imagen_categoria: string;
    activo_categoria?: boolean;
  }
): Promise<AxiosResponse<Categoria>> =>
  api.put(`/categoriaUpd/${id}`, data);

// Elimina a una categoria apartir del id
export const deleteCategoria = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/categoriaDel/${id}`);