import api from './axios';
import type { Material } from '../types';

export const getMaterials = (topicId: string) => api.get<Material[]>(`/materials/topic/${topicId}`).then(r => r.data);
export const createMaterial = (data: Partial<Material>) => api.post<Material>('/materials', data).then(r => r.data);
export const updateMaterial = (id: string, data: Partial<Material>) => api.put<Material>(`/materials/${id}`, data).then(r => r.data);
export const deleteMaterial = (id: string) => api.delete(`/materials/${id}`).then(r => r.data);
export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<{ url: string; filename: string; mimetype: string }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};
