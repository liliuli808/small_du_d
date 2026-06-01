import request from './request';

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
    request.get('/categories'),

  getDetail: (id: number) =>
    request.get(`/categories/${id}`),

  getPosts: (id: number, cursor?: string, limit?: number) =>
    request.get(`/categories/${id}/posts`, {
      params: { cursor, limit },
    }),

  getModerators: (id: number) =>
    request.get(`/categories/${id}/moderators`),
};
