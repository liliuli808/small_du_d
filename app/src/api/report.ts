import request from './request';

export interface CreateReportParams {
  targetType: number;
  targetId: number;
  categoryId?: number;
  reasonType: number;
  reasonText?: string;
}

export const reportAPI = {
  // 创建举报
  create: (params: CreateReportParams) =>
    request.post('/reports', params),

  // 获取我的举报记录
  getMyReports: (limit?: number, offset?: number) =>
    request.get('/reports/my', {
      params: { limit, offset },
    }),
};
