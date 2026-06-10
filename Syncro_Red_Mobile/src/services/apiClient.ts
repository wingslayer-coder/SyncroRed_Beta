import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';

export const STORAGE_KEYS = {
  ACCESS: 'syncro_access',
  REFRESH: 'syncro_refresh',
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS);
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH);
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh });
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS, data.access);
        original.headers['Authorization'] = `Bearer ${data.access}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
