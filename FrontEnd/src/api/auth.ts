import api from './axios';
import type { LoginData, User } from '../types/auth';
import type { AxiosResponse } from 'axios';

export const loginRequest = (
  data: LoginData
): Promise<AxiosResponse<{ user: User }>> =>
  api.post('/login', data);

export const logoutRequest = (): Promise<AxiosResponse<void>> =>
  api.post('/logout');
