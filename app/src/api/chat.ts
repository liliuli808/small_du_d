import { api, PaginatedResponse } from './request';

export interface Conversation {
  id: number;
  userAId: number;
  userBId: number;
  status: number;
  lastMessageId?: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: number;
  status: number;
  createdAt: string;
}

export const chatAPI = {
  getConversations: () =>
    api.get<Conversation[]>('/conversations'),

  createConversation: (targetUserId: number) =>
    api.post<Conversation>('/conversations', { targetUserId }),

  getMessages: (conversationId: number, cursor?: string, limit?: number) =>
    api.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, {
      params: { cursor, limit },
    }),
};
