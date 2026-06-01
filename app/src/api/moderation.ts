import request from './request';

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
  // 负责人删除帖子
  deletePost: (id: number, reason: string, remark?: string) =>
    request.post(`/moderation/posts/${id}/delete`, { reason, remark }),

  // 负责人删除评论
  deleteComment: (id: number, reason: string, remark?: string) =>
    request.post(`/moderation/comments/${id}/delete`, { reason, remark }),

  // 获取本分区的举报列表
  getReports: (categoryId: number, status?: number, limit?: number, offset?: number) =>
    request.get(`/moderation/categories/${categoryId}/reports`, {
      params: { status, limit, offset },
    }),

  // 处理举报
  handleReport: (id: number, status: number, remark?: string) =>
    request.post(`/moderation/reports/${id}/handle`, { status, remark }),

  // 编辑分区公告
  updateAnnouncement: (categoryId: number, announcement: string) =>
    request.post(`/moderation/categories/${categoryId}/announcement`, { announcement }),

  // 编辑分区规则
  updateRules: (categoryId: number, rules: string) =>
    request.post(`/moderation/categories/${categoryId}/rules`, { rules }),

  // 获取操作日志
  getLogs: (limit?: number, offset?: number) =>
    request.get('/moderation/logs', {
      params: { limit, offset },
    }),
};
