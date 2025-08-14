import api from './axios';
import type { LoginData, User } from '../types/auth';
import type { AxiosResponse } from 'axios';

export interface RegisterData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  password: string;
  telefono: string;
  direccion?: string;
  foto?: string;
}

export const loginRequest = (
  data: LoginData
): Promise<AxiosResponse<User>> =>
  api.post('/login', data);

export const logoutRequest = (): Promise<AxiosResponse<void>> =>
  api.post('/logout');

export const verifyRequest = (): Promise<AxiosResponse<User>> =>
  api.get('/verify');

export const registerRequest = (
  data: RegisterData
): Promise<AxiosResponse<User>> =>
  api.post('/register', data);