import api from './axios';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  configured: boolean;
}

// Mavzu bo'yicha AI yordamchiga savol yuboradi.
// Backend hozircha provayderdan mustaqil — API kalit sozlanmaguncha
// izohli javob qaytaradi (configured: false).
export const askAi = (data: { topicId?: string; messages: AiChatMessage[] }) =>
  api.post<AiChatResponse>('/ai/chat', data).then(r => r.data);
