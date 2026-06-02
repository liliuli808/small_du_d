import request from './request'

export interface Moderator {
  id: number
  categoryId: number
  userId: number
  role: number
  status: number
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

export const moderatorAPI = {
  getList: (params?: { categoryId?: number }) =>
    request.get('/admin/moderators', { params }),

  create: (data: { categoryId: number; userId: number; role: number }) =>
    request.post('/admin/moderators', data),

  delete: (id: number) =>
    request.delete(`/admin/moderators/${id}`),
}
