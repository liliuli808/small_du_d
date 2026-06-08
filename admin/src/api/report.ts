import { api } from './request'

export interface Report {
  id: number
  reporterId: number
  targetType: number
  targetId: number
  categoryId?: number
  reasonType: number
  reasonText: string
  status: number
  createdAt: string
}

export const reportAPI = {
  getList: (categoryId: number, params?: { status?: number; limit?: number; offset?: number }) =>
    api.get<Report[]>(`/moderation/categories/${categoryId}/reports`, { params }),
}
