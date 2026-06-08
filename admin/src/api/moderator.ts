import { api } from './request'

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
    api.get<Moderator[]>('/admin/moderators', { params }),

  create: (data: { categoryId: number; userId: number; role: number }) =>
    api.post<Moderator>('/admin/moderators', data),

  delete: (id: number) =>
    api.delete(`/admin/moderators/${id}`),
}
