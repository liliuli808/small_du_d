import { api, PaginatedResponse } from './request'

export interface Appeal {
  id: number
  userId: number
  targetType: number
  targetId: number
  categoryId?: number
  reason: string
  status: number
  handlerId?: number
  handleResult?: string
  handledAt?: string
  createdAt: string
  user?: {
    id: number
    nickname: string
  }
}

export const appealAPI = {
  getList: (params?: { status?: number; limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<Appeal>>('/admin/appeals', { params }),

  handle: (id: number, data: { status: number; handleResult: string }) =>
    api.post(`/admin/appeals/${id}/handle`, data),
}
