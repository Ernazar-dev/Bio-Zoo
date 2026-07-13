import api from './axios';
import type { Subject, Category } from '../types';

export const getSubjects = () => api.get<Subject[]>('/subjects').then(r => r.data);
export const getSubjectBySlug = (slug: string) =>
  api.get<Subject & { categories: Category[] }>(`/subjects/${slug}`).then(r => r.data);
export const createSubject = (data: Partial<Subject>) => api.post<Subject>('/subjects', data).then(r => r.data);
export const updateSubject = (id: string, data: Partial<Subject>) => api.put<Subject>(`/subjects/${id}`, data).then(r => r.data);
export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`).then(r => r.data);
