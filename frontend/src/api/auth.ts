import api from './axios';
import type { User } from '../types';

interface AuthResponse { accessToken: string; refreshToken: string; user: User; }
export const register = (data: { name: string; login: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data).then(r => r.data);
export const login = (data: { login: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data);
export const logout = (refreshToken: string) =>
  api.post('/auth/logout', { refreshToken }).then(r => r.data);
