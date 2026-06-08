import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const BASE_URL = 'http://localhost:8082/api/v1';

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入 Token
request.interceptors.request.use(
  (config) => {
    const token = storage.getString('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：统一错误处理、Token 刷新
request.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Token 过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = storage.getString('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        storage.set('accessToken', accessToken);
        storage.set('refreshToken', newRefreshToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return request(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除登录态
        storage.delete('accessToken');
        storage.delete('refreshToken');
        storage.delete('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.get(url, config) as any,

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.post(url, data, config) as any,

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    request.put(url, data, config) as any,

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.delete(url, config) as any,
};

export default request;
