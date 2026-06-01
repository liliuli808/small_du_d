import request from './request';

export interface Election {
  id: number;
  categoryId: number;
  title: string;
  status: number;
  signupStartAt?: string;
  signupEndAt?: string;
  voteStartAt?: string;
  voteEndAt?: string;
  publicityEndAt?: string;
  createdAt: string;
}

export interface ElectionCandidate {
  id: number;
  electionId: number;
  userId: number;
  manifesto: string;
  status: number;
  voteCount: number;
  createdAt: string;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
}

export const electionAPI = {
  // 选举列表
  getList: (status?: number, limit?: number, offset?: number) =>
    request.get('/elections', {
      params: { status, limit, offset },
    }),

  // 选举详情
  getDetail: (id: number) =>
    request.get(`/elections/${id}`),

  // 报名参选
  signup: (id: number, manifesto: string) =>
    request.post(`/elections/${id}/candidates`, { manifesto }),

  // 获取候选人列表
  getCandidates: (id: number) =>
    request.get(`/elections/${id}/candidates`),

  // 投票
  vote: (id: number, candidateId: number) =>
    request.post(`/elections/${id}/vote`, { candidateId }),

  // 获取选举结果
  getResult: (id: number) =>
    request.get(`/elections/${id}/result`),
};
