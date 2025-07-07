import api from './axios';
import type { AxiosResponse } from 'axios';

export interface Empresa {
  id_empresa: string;
  nombre_empresa: string;
  logo_empresa?: string;
  telefono_empresa?: string;
  email_empresa: string;
  estado_empresa?: string;
  ciudad_empresa?: string;
  codigo_postal_empresa?: string;
  calle_empresa?: string;
  colonia_empresa?: string;
  latitud_empresa?: string;
  longitud_empresa?: string;
}

export interface RedSocial {
  id_red: string;
  nombre_red: string;
  logo_red?: string;
  enlace: string;
  id_empresa: string;
}

// GET Trae los datos de empresa
export const getEmpresa = (id: string): Promise<AxiosResponse<Empresa>> =>
  api.get(`/empresa/${id}`);

// PUT Actualiza los datos de empresa
export const updateEmpresa = (
  id: string,
  data: {
    nombre_empresa: string;
    logo_empresa?: string;
    telefono_empresa?: string;
    email_empresa: string;
    estado_empresa?: string;
    ciudad_empresa?: string;
    codigo_postal_empresa?: string;
    calle_empresa?: string;
    colonia_empresa?: string;
    latitud_empresa?: string;
    longitud_empresa?: string;
  }
): Promise<AxiosResponse<Empresa>> =>
  api.put(`/empresaUpd/${id}`, data);


//REDES SOCIALES//
// GET Trae todas las redes
export const getAllRedes = (): Promise<AxiosResponse<RedSocial[]>> =>
  api.get('/redes');

// GET Trae datos de una red por id
export const getRedSocialById = (id: string): Promise<AxiosResponse<RedSocial>> =>
  api.get(`/redes/${id}`);

// POST Crea una nueva red social
export const createRedSocial = (
  empresaId: string,
  data: {
    nombre_red: string;
    logo_red?: string;
    enlace: string;
  }
): Promise<AxiosResponse<RedSocial>> =>
  api.post(`/redesCre/${empresaId}`, data);

// PUT Actualiza una red social por id
export const updateRedSocial = (
  id: string,
  data: {
    nombre_red: string;
    logo_red?: string;
    enlace: string;
    id_empresa: string;
  }
): Promise<AxiosResponse<RedSocial>> =>
  api.put(`/redesUpd/${id}`, data);

// DELETE Elimina una red social por su id
export const deleteRedSocial = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/redesDel/${id}`);
