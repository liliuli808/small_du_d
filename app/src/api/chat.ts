import request from './request';

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
    request.get('/conversations'),

  createConversation: (targetUserId: number) =>
    request.post('/conversations', { targetUserId }),

  getMessages: (conversationId: number, cursor?: string, limit?: number) =>
    request.get(`/conversations/${conversationId}/messages`, {
      params: { cursor, limit },
    }),
};
