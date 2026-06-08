import { api, PaginatedResponse } from './request';
import { Post } from './post';

export interface Category {
  id: number;
  name: string;
  iconUrl: string;
  description: string;
  rules: string;
  announcement: string;
  allowImage: boolean;
  enableChat: boolean;
  postCount: number;
  status: number;
}

export const categoryAPI = {
  getList: () =>
    api.get<Category[]>('/categories'),

  getDetail: (id: number) =>
    api.get<Category>(`/categories/${id}`),

  getPosts: (id: number, cursor?: string, limit?: number) =>
    api.get<PaginatedResponse<Post>>(`/categories/${id}/posts`, {
      params: { cursor, limit },
    }),

  getModerators: (id: number) =>
    api.get<Moderator[]>(`/categories/${id}/moderators`),
};

export interface Moderator {
  id: number;
  userId: number;
  role: number;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
}
