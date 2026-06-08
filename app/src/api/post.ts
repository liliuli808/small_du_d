import { api, PaginatedResponse } from './request';

export interface Post {
  id: number;
  userId: number;
  categoryId: number;
  content: string;
  status: number;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
  category?: {
    id: number;
    name: string;
  };
  images?: Array<{
    id: number;
    imageUrl: string;
    thumbUrl?: string;
    width: number;
    height: number;
  }>;
}

export interface CreatePostParams {
  categoryId: number;
  content: string;
  images?: Array<{
    objectKey: string;
    imageUrl: string;
    thumbUrl?: string;
    width: number;
    height: number;
  }>;
}

export const postAPI = {
  getFeed: (sort?: string, cursor?: string, limit?: number) =>
    api.get<PaginatedResponse<Post>>('/posts/feed', {
      params: { sort, cursor, limit },
    }),

  getPost: (id: number) =>
    api.get<Post>(`/posts/${id}`),

  createPost: (params: CreatePostParams) =>
    api.post<Post>('/posts', params),

  deletePost: (id: number) =>
    api.delete(`/posts/${id}`),

  likePost: (id: number) =>
    api.post<{ id: number }>(`/posts/${id}/like`),

  unlikePost: (id: number) =>
    api.delete(`/posts/${id}/like`),
};
