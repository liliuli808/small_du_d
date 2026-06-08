import { api } from './request'

export interface Election {
  id: number
  categoryId: number
  title: string
  status: number
  signupStartAt?: string
  signupEndAt?: string
  voteStartAt?: string
  voteEndAt?: string
  createdAt: string
}

export const electionAPI = {
  getList: () => api.get<Election[]>('/admin/elections'),

  create: (data: {
    categoryId: string
    title: string
    signupStartAt: string
    signupEndAt: string
    voteStartAt: string
    voteEndAt: string
    publicityEndAt: string
  }) => api.post<Election>('/admin/elections', data),

  finish: (id: number) =>
    api.post(`/admin/elections/${id}/finish`),
}
