import api from './axios';
import type { Quiz, QuizResult } from '../types';

export const getQuizzes = (topicId: string) => api.get<Quiz[]>(`/quizzes/topic/${topicId}`).then(r => r.data);
export const createQuiz = (data: Partial<Quiz>) => api.post<Quiz>('/quizzes', data).then(r => r.data);
export const updateQuiz = (id: string, data: Partial<Quiz>) => api.put<Quiz>(`/quizzes/${id}`, data).then(r => r.data);
export const deleteQuiz = (id: string) => api.delete(`/quizzes/${id}`).then(r => r.data);
export const answerQuiz = (quizId: string, answers: Record<string, string>) =>
  api.post<QuizResult>(`/quizzes/${quizId}/answer`, { answers }).then(r => r.data);
export const getMyResults = (topicId: string) =>
  api.get<QuizResult[]>(`/users/me/quiz-results/${topicId}`).then(r => r.data);
export const getQuizResults = (quizId: string) =>
  api.get<any[]>(`/quizzes/${quizId}/results`).then(r => r.data);
