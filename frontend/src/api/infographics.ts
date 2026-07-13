import api from './axios';
import type { Infographic } from '../types';

export const getInfographicsByTopic = (topicId: string) =>
  api.get<Infographic[]>(`/infographics/topic/${topicId}`).then(r => r.data);
export const createInfographic = (data: Partial<Infographic>) =>
  api.post<Infographic>('/infographics', data).then(r => r.data);
export const updateInfographic = (id: string, data: Partial<Infographic>) =>
  api.put<Infographic>(`/infographics/${id}`, data).then(r => r.data);
export const deleteInfographic = (id: string) =>
  api.delete(`/infographics/${id}`).then(r => r.data);
