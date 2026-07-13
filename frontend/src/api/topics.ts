import api from './axios';
import type { Topic, TopicDetail } from '../types';

export const getTopics = (categoryId?: string) =>
  api.get<Topic[]>('/topics', { params: categoryId ? { categoryId } : {} }).then(r => r.data);
export const getTopicById = (id: string) => api.get<TopicDetail>(`/topics/${id}`).then(r => r.data);
export const createTopic = (data: Partial<Topic>) => api.post<Topic>('/topics', data).then(r => r.data);
export const updateTopic = (id: string, data: Partial<Topic>) => api.put<Topic>(`/topics/${id}`, data).then(r => r.data);
export const deleteTopic = (id: string) => api.delete(`/topics/${id}`).then(r => r.data);
