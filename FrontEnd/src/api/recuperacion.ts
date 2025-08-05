import api from './axios';

export interface SolicitarRecuperacionData {
  email: string;
}

export interface ValidarCodigoData {
  email: string;
  codigo: string;
}

export interface ReenviarCodigoData {
  email: string;
}

export interface RestablecerPasswordData {
  email: string;
  codigo: string;
  nuevaPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface ValidarCodigoResponse {
  message: string;
  tipo_usuario: 'admin' | 'inquilino';
}

// Solicitar recuperación de contraseña
export const solicitarRecuperacion = (data: SolicitarRecuperacionData) =>
  api.post<MessageResponse>('/solicitar-recuperacion', data);

// Validar código
export const validarCodigo = (data: ValidarCodigoData) =>
  api.post<ValidarCodigoResponse>('/validar-codigo', data);

// Reenviar código
export const reenviarCodigo = (data: ReenviarCodigoData) =>
  api.post<MessageResponse>('/reenviar-codigo', data);

// Restablecer contraseña
export const restablecerPassword = (data: RestablecerPasswordData) =>
  api.post<MessageResponse>('/restablecer-password', data);