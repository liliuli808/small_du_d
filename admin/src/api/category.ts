import { api } from './request'

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
  getList: () => api.get<Category[]>('/admin/categories'),

  create: (data: Partial<Category>) =>
    api.post<Category>('/admin/categories', data),

  update: (id: number, data: Partial<Category>) =>
    api.put<Category>(`/admin/categories/${id}`, data),
}
