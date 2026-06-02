import request from './request'

export interface Category {
  id: number
  name: string
  description: string
  rules: string
  announcement: string
  allowImage: boolean
  enableChat: boolean
  enableElection: boolean
  status: number
  sortWeight: number
  postCount: number
  createdAt: string
}

export const categoryAPI = {
  getList: () => request.get('/admin/categories'),

  create: (data: Partial<Category>) =>
    request.post('/admin/categories', data),

  update: (id: number, data: Partial<Category>) =>
    request.put(`/admin/categories/${id}`, data),
}
