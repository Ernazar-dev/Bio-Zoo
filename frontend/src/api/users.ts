import api from './axios';
import type { User } from '../types';

export const getStats = () =>
  api.get<{ categories: number; topics: number; students: number }>('/users/stats').then(r => r.data);
export const getLeaderboard = () => api.get<User[]>('/users/leaderboard').then(r => r.data);
export const getMe = () => api.get<User>('/users/me').then(r => r.data);
export const getAllStudents = () => api.get<User[]>('/users').then(r => r.data);
export const deleteStudent = (id: string) => api.delete<{ message: string }>(`/users/${id}`).then(r => r.data);
export const getMyActivity = () => api.get('/users/me/activity').then(r => r.data);

export interface MyProgress {
  totalQuizzes: number;
  mastered: number;
  learning: number;
  remaining: number;
  percent: number;
  byTopic: { topicId: string; percent: number }[];
}
export const getMyProgress = () => api.get<MyProgress>('/users/me/progress').then(r => r.data);

export interface MyRank {
  rank: number;
  total: number;
  points: number;
}
export const getMyRank = () => api.get<MyRank>('/users/me/rank').then(r => r.data);

export interface PortfolioItem {
  id: string;
  score: number;
  correctCount: number;
  totalCount: number;
  earnedPoints: number;
  createdAt: string;
  quiz: { topic: { id: string; title: string; category: { name: string } | null } | null } | null;
}
export const getMyPortfolio = () => api.get<PortfolioItem[]>('/users/me/portfolio').then(r => r.data);

export interface ActivityItem {
  id: string;
  action: string;
  points: number;
  meta?: any;
  createdAt: string;
}
export const getMyActivityTyped = () => api.get<ActivityItem[]>('/users/me/activity').then(r => r.data);
