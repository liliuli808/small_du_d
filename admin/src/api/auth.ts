import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export const authAPI = {
  login: (params: LoginParams) =>
    request.post('/auth/login', params),
}
