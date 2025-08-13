import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Contenido {
  id_contenido: string;
  titulo_contenido: string;
  texto_contenido: string;
  multimedia_url: string;
  id_seccion: string;
}

// Trae a todos los contenidos de una seccion
export const getContenidosBySeccion = (seccionId: string): Promise<AxiosResponse<Contenido[]>> =>
  api.get(`/contenidos/${seccionId}`);

// Trae a un contenido por su id
export const getContenidoById = (id: string): Promise<AxiosResponse<Contenido>> =>
  api.get(`/contenido/${id}`);

// Crea un contenido pasando el id de la seccion que pertenecera
export const createContenido = (
  seccionId: string,
  data: {
    titulo_contenido: string;
    texto_contenido: string;
    multimedia_url: string;
  }
): Promise<AxiosResponse<Contenido>> =>
  api.post(`/contenidoCre/${seccionId}`, data);

// Actualiza a un contenido por su id
export const updateContenido = (
  id: string,
  data: {
    titulo_contenido: string;
    texto_contenido: string;
    multimedia_url: string;
  }
): Promise<AxiosResponse<Contenido>> =>
  api.put(`/contenidoUpd/${id}`, data);

// Elimina a un contenido por su id
export const deleteContenido = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/contenidoDel/${id}`);