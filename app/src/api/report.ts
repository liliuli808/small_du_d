import { api } from './request';

export interface CreateReportParams {
  targetType: number;
  targetId: number;
  categoryId?: number;
  reasonType: number;
  reasonText?: string;
}

export const reportAPI = {
  create: (params: CreateReportParams) =>
    api.post('/reports', params),

  getMyReports: (limit?: number, offset?: number) =>
    api.get<Report[]>('/reports/my', {
      params: { limit, offset },
    }),
};

export interface Report {
  id: number;
  reporterId: number;
  targetType: number;
  targetId: number;
  categoryId?: number;
  reasonType: number;
  reasonText: string;
  status: number;
  createdAt: string;
}
