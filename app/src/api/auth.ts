import { api } from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  status: number;
  role: number;
  createdAt: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export const authAPI = {
  login: (params: LoginParams) =>
    api.post<LoginResult>('/auth/login', params),

  register: (params: RegisterParams) =>
    api.post<LoginResult>('/auth/register', params),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  getMe: () =>
    api.get<UserInfo>('/users/me'),

  updateMe: (data: Partial<UserInfo>) =>
    api.put<UserInfo>('/users/me', data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
};
