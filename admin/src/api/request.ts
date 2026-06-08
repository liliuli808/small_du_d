import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

const BASE_URL = 'http://localhost:8082/api/v1'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动注入 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data.data
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.get(url, config) as any,
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.post(url, data, config) as any,
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.put(url, data, config) as any,
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.patch(url, data, config) as any,
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.delete(url, config) as any,
}

export default request
