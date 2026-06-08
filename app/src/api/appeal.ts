import { api } from './request'

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
}

export const appealAPI = {
  create: (data: { targetType: number; targetId: number; categoryId?: number; reason: string }) =>
    api.post<Appeal>('/appeals', data),

  getMyAppeals: (limit?: number, offset?: number) =>
    api.get<Appeal[]>('/appeals/my', {
      params: { limit, offset },
    }),

  getDetail: (id: number) =>
    api.get<Appeal>(`/appeals/${id}`),
}
