import { api } from './request';

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
  getList: (status?: number, limit?: number, offset?: number) =>
    api.get<Election[]>('/elections', {
      params: { status, limit, offset },
    }),

  getDetail: (id: number) =>
    api.get<Election>(`/elections/${id}`),

  signup: (id: number, manifesto: string) =>
    api.post(`/elections/${id}/candidates`, { manifesto }),

  getCandidates: (id: number) =>
    api.get<ElectionCandidate[]>(`/elections/${id}/candidates`),

  vote: (id: number, candidateId: number) =>
    api.post(`/elections/${id}/vote`, { candidateId }),

  getResult: (id: number) =>
    api.get<Election>(`/elections/${id}/result`),
};
