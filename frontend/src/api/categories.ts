import api from './axios';
import type { Category } from '../types';

export const getCategories = () => api.get<Category[]>('/categories').then(r => r.data);
export const getCategoryBySlug = (slug: string) => api.get<Category & { topics: any[] }>(`/categories/${slug}`).then(r => r.data);
export const createCategory = (data: Partial<Category>) => api.post<Category>('/categories', data).then(r => r.data);
export const updateCategory = (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data).then(r => r.data);
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`).then(r => r.data);
