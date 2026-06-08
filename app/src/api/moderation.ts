import { api, PaginatedResponse } from './request';

export interface ModerationLog {
  id: number;
  operatorId: number;
  operatorRole: number;
  categoryId?: number;
  actionType: number;
  targetType: number;
  targetId: number;
  reason: string;
  remark: string;
  createdAt: string;
}

export interface Report {
  id: number;
  reporterId: number;
  targetType: number;
  targetId: number;
  categoryId?: number;
  reasonType: number;
  reasonText: string;
  status: number;
  handlerId?: number;
  handlerRole?: number;
  handledAt?: string;
  createdAt: string;
}

export const moderationAPI = {
  deletePost: (id: number, reason: string, remark?: string) =>
    api.post(`/moderation/posts/${id}/delete`, { reason, remark }),

  deleteComment: (id: number, reason: string, remark?: string) =>
    api.post(`/moderation/comments/${id}/delete`, { reason, remark }),

  getReports: (categoryId: number, status?: number, limit?: number, offset?: number) =>
    api.get<PaginatedResponse<Report>>(`/moderation/categories/${categoryId}/reports`, {
      params: { status, limit, offset },
    }),

  handleReport: (id: number, status: number, remark?: string) =>
    api.post(`/moderation/reports/${id}/handle`, { status, remark }),

  updateAnnouncement: (categoryId: number, announcement: string) =>
    api.post(`/moderation/categories/${categoryId}/announcement`, { announcement }),

  updateRules: (categoryId: number, rules: string) =>
    api.post(`/moderation/categories/${categoryId}/rules`, { rules }),

  getLogs: (limit?: number, offset?: number) =>
    api.get<PaginatedResponse<ModerationLog>>('/moderation/logs', {
      params: { limit, offset },
    }),
};
