import request from './request'

export interface Appeal {
  id: number
  userId: number
  targetType: number
  targetId: number
  categoryId?: number
  reason: string
  status: number // 0:待处理 1:已通过 2:已驳回
  handlerId?: number
  handleResult?: string
  handledAt?: string
  createdAt: string
}

export const appealAPI = {
  create: (data: { targetType: number; targetId: number; categoryId?: number; reason: string }) =>
    request.post('/appeals', data),

  getMyAppeals: (limit?: number, offset?: number) =>
    request.get('/appeals/my', {
      params: { limit, offset },
    }),

  getDetail: (id: number) =>
    request.get(`/appeals/${id}`),
}
