import { api, PaginatedResponse } from './request'

export interface User {
  id: number
  username: string
  nickname: string
  avatarUrl: string
  bio: string
  status: number
  role: number
  createdAt: string
}

export const userAPI = {
  getList: (params?: { status?: number; keyword?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),

  updateStatus: (id: number, status: number) =>
    api.patch(`/admin/users/${id}/status`, { status }),
}
