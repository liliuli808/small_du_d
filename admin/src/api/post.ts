import request from './request'

export interface Post {
  id: number
  userId: number
  categoryId: number
  content: string
  status: number
  likeCount: number
  commentCount: number
  createdAt: string
  user?: {
    id: number
    nickname: string
  }
  category?: {
    id: number
    name: string
  }
}

export const postAPI = {
  getList: (params?: { status?: number; categoryId?: number; keyword?: string; limit?: number; offset?: number }) =>
    request.get('/admin/posts', { params }),

  delete: (id: number, reason: string) =>
    request.post(`/admin/posts/${id}/delete`, { reason }),
}
