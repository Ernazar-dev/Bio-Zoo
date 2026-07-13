import api from './axios';
import type { GameLink } from '../types';

export const getGames = (topicId: string) => api.get<GameLink[]>(`/games/topic/${topicId}`).then(r => r.data);
export const createGame = (data: Partial<GameLink>) => api.post<GameLink>('/games', data).then(r => r.data);
export const updateGame = (id: string, data: Partial<GameLink>) => api.put<GameLink>(`/games/${id}`, data).then(r => r.data);
export const deleteGame = (id: string) => api.delete(`/games/${id}`).then(r => r.data);
export const openGame = (id: string) => api.post(`/games/${id}/open`).then(r => r.data);
