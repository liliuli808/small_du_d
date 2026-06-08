import { api } from './request'

export interface Notification {
  id: number
  userId: number
  type: number
  title: string
  content: string
  targetType: number
  targetId: number
  isRead: boolean
  createdAt: string
}

export const notificationAPI = {
  getList: (limit?: number, offset?: number) =>
    api.get<{ items: Notification[]; unreadCount: number }>('/notifications', {
      params: { limit, offset },
    }),

  markRead: (id: number) =>
    api.post(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post('/notifications/read-all'),
}
