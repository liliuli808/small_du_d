import request from './request'

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
  getList: () => request.get('/admin/elections'),

  create: (data: {
    categoryId: string
    title: string
    signupStartAt: string
    signupEndAt: string
    voteStartAt: string
    voteEndAt: string
    publicityEndAt: string
  }) => request.post('/admin/elections', data),

  finish: (id: number) =>
    request.post(`/admin/elections/${id}/finish`),
}
