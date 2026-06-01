import request from './request';

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

export const authAPI = {
  login: (params: LoginParams) =>
    request.post('/auth/login', params),

  register: (params: RegisterParams) =>
    request.post('/auth/register', params),

  refresh: (refreshToken: string) =>
    request.post('/auth/refresh', { refreshToken }),

  getMe: () =>
    request.get('/users/me'),

  updateMe: (data: Partial<UserInfo>) =>
    request.put('/users/me', data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request.put('/users/me/password', data),
};
