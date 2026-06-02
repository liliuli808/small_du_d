import request from './request';

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
    request.get('/posts/feed', {
      params: { sort, cursor, limit },
    }),

  getPost: (id: number) =>
    request.get(`/posts/${id}`),

  createPost: (params: CreatePostParams) =>
    request.post('/posts', params),

  deletePost: (id: number) =>
    request.delete(`/posts/${id}`),

  likePost: (id: number) =>
    request.post(`/posts/${id}/like`),

  unlikePost: (id: number) =>
    request.delete(`/posts/${id}/like`),
};
