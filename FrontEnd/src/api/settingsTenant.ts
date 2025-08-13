import api from './axios';

// PERFIL
export interface PerfilInquilino {
  id_inquilino: string;
  nombre_inquilino: string;
  apellido_paterno: string;
  apellido_materno?: string;
  email_inquilino: string;
  telefono_inquilino?: string;
  direccion_inquilino?: string;
  foto_inquilino?: string;
  fecha_registro: string;
}

// CONFIGURACIÓN
export interface ConfiguracionMensajes {
  id_configuracion: string;
  motivo: string;
  mensaje_pre_vencimiento: string;
  mensaje_post_vencimiento: string;
  medio: string;
  frecuencia: number;
  id_inquilino: string;
}

// PASARELAS
export interface Pasarela {
  id_credencial: string;
  id_inquilino: string;
  pasarela: 'stripe' | 'paypal';
  credenciales_api: string;
  client_secret?: string;
  webhook_secret?: string;  
  webhook_id?: string;   
  fecha_registro: string;
  fecha_actualizacion?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

// --- PERFIL ---
export const getPerfil = () =>
  api.get<PerfilInquilino>('/tenant/settings/perfil');

export const updatePerfil = (data: Partial<PerfilInquilino>) =>
  api.put<{ message: string; perfil: PerfilInquilino }>('/tenant/settings/perfil', data);

export const changePassword = (data: {
  password_actual: string;
  password_nueva: string;
  confirmar_password: string;
}) => api.put<{ message: string }>('/tenant/settings/perfil/password', data);

// --- CONFIGURACIÓN ---
export const getConfiguracion = () =>
  api.get<ConfiguracionMensajes>('/tenant/settings/configuracion');

export const updateConfiguracion = (data: Partial<ConfiguracionMensajes>) =>
  api.put<{ message: string; configuracion: ConfiguracionMensajes }>('/tenant/settings/configuracion', data);

// --- PASARELAS ---
export const getPasarelas = () =>
  api.get<Pasarela[]>('/tenant/settings/pasarelas');

export const upsertPasarela = (data: {
  pasarela: 'stripe' | 'paypal';
  credenciales_api: string;
  client_secret?: string;
  webhook_secret?: string;    
  webhook_id?: string;         
}) => api.post<{ message: string; pasarela: Pasarela }>('/tenant/settings/pasarelas', data);

export const updateEstadoPasarela = (tipo: 'stripe' | 'paypal', data: {
  estado: 'ACTIVO' | 'INACTIVO';
}) => api.put<{ message: string; pasarela: Pasarela }>(`/tenant/settings/pasarelas/${tipo}/estado`, data);