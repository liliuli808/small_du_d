import request from './request'

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
    request.get('/notifications', {
      params: { limit, offset },
    }),

  markRead: (id: number) =>
    request.post(`/notifications/${id}/read`),

  markAllRead: () =>
    request.post('/notifications/read-all'),
}
