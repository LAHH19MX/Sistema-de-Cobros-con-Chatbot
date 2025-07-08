// src/api/auth.ts
import api from './axios';
import type { LoginData, User } from '../types/auth';
import type { AxiosResponse } from 'axios';

// El backend devuelve directamente User, no { user: User }
export const loginRequest = (
  data: LoginData
): Promise<AxiosResponse<User>> =>
  api.post('/login', data);

export const logoutRequest = (): Promise<AxiosResponse<void>> =>
  api.post('/logout');

export const verifyRequest = (): Promise<AxiosResponse<User>> =>
  api.get('/verify');


