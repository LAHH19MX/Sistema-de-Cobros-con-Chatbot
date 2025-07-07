import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Contenido {
  id_contenido: string;
  titulo_contenido: string;
  texto_contenido: string;
  multimedia_url: string;
  id_seccion: string;
}

// 1. GET /contenidos/:seccionId Trae a todos los contenidos de una seccion
export const getContenidosBySeccion = (seccionId: string): Promise<AxiosResponse<Contenido[]>> =>
  api.get(`/contenidos/${seccionId}`);

// 2. GET /contenido/:id Trae a un contenido por su id
export const getContenidoById = (id: string): Promise<AxiosResponse<Contenido>> =>
  api.get(`/contenido/${id}`);

// 3. POST /contenidoCre/:seccionId Crea un contenido pasando el id de la seccion que pertenecera
export const createContenido = (
  seccionId: string,
  data: {
    titulo_contenido: string;
    texto_contenido: string;
    multimedia_url: string;
  }
): Promise<AxiosResponse<Contenido>> =>
  api.post(`/contenidoCre/${seccionId}`, data);

// 4. PUT /contenidoUpd/:id Actualiza a un contenido por su id
export const updateContenido = (
  id: string,
  data: {
    titulo_contenido: string;
    texto_contenido: string;
    multimedia_url: string;
  }
): Promise<AxiosResponse<Contenido>> =>
  api.put(`/contenidoUpd/${id}`, data);

// 5. DELETE /contenidoDel/:id Elimina a un contenido por su id
export const deleteContenido = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/contenidoDel/${id}`);