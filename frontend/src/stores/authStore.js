import { create } from 'zustand';
import api from '../lib/api';

/**
 * Kimlik doğrulama state yönetimi.
 * Zustand ile global auth state.
 */
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('tanilog_token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('tanilog_token'),

  // Kullanıcı kaydı
  register: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Giriş
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const { data } = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('tanilog_token', data.access_token);
      set({
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Mevcut kullanıcı bilgisi
  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem('tanilog_token');
    }
  },

  // Çıkış
  logout: () => {
    localStorage.removeItem('tanilog_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
