import { api } from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    username: string
    nickname: string
    avatarUrl: string
    role: number
  }
}

export const authAPI = {
  login: (params: LoginParams) =>
    api.post<LoginResult>('/auth/login', params),
}
