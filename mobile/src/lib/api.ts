import axios from 'axios';
import { clearToken, getToken } from './token';

const LOCAL_ANDROID_API_URL = 'http://10.0.2.2:8000/api/v1';
const PRODUCTION_API_URL = 'https://tanilog.onrender.com/api/v1';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? LOCAL_ANDROID_API_URL : PRODUCTION_API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  },
);

export default api;
