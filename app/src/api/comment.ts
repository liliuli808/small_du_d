import request from './request';

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  parentId: number;
  content: string;
  status: number;
  createdAt: string;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
}

export const commentAPI = {
  getList: (postId: number, limit?: number, offset?: number) =>
    request.get(`/posts/${postId}/comments`, {
      params: { limit, offset },
    }),

  create: (postId: number, content: string, parentId?: number) =>
    request.post(`/posts/${postId}/comments`, { content, parentId }),

  delete: (id: number) =>
    request.delete(`/comments/${id}`),
};
