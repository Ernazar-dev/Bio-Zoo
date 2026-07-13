import api from './axios';
import type { Interactive } from '../types';

export const getInteractivesByTopic = (topicId: string) =>
  api.get<Interactive[]>(`/interactives/topic/${topicId}`).then(r => r.data);
export const getAllowedHosts = () =>
  api.get<string[]>('/interactives/allowed-hosts').then(r => r.data);
export const createInteractive = (data: Partial<Interactive>) =>
  api.post<Interactive>('/interactives', data).then(r => r.data);
export const updateInteractive = (id: string, data: Partial<Interactive>) =>
  api.put<Interactive>(`/interactives/${id}`, data).then(r => r.data);
export const deleteInteractive = (id: string) =>
  api.delete(`/interactives/${id}`).then(r => r.data);

/* Admin qo'ygan matndan embed URL ni ajratib olish:
   - to'liq <iframe ...> kodi bo'lsa — src qiymati olinadi
   - Sketchfab model sahifasi havolasi bo'lsa — /models/<id>/embed ga aylantiriladi
   - oddiy URL bo'lsa — o'zi qaytadi */
export function extractEmbedUrl(input: string): string {
  const text = (input || '').trim();
  const iframeSrc = text.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  if (iframeSrc) return iframeSrc[1];
  const sketchfabId = text.match(/sketchfab\.com\/(?:3d-models\/(?:[\w-]*-)?|models\/)([0-9a-f]{32})/i);
  if (sketchfabId) return `https://sketchfab.com/models/${sketchfabId[1]}/embed`;
  return text;
}
