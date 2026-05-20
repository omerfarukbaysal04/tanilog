import { create } from 'zustand';
import api from '../lib/api';

/**
 * Kimlik doğrulama state yönetimi.
 * Zustand ile global auth state.
 */
const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('tanilog_token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('tanilog_token'),

  // Uygulama başlangıcında auth durumunu kontrol et
  initAuth: async () => {
    const token = localStorage.getItem('tanilog_token');
    if (token) {
      try {
        const { data } = await api.get('/auth/me');
        set({ user: data, isAuthenticated: true, token });
      } catch {
        localStorage.removeItem('tanilog_token');
        set({ user: null, isAuthenticated: false, token: null });
      }
    }
  },

  // Kullanıcı kaydı
  register: async (email, password, fullName, acceptedTerms = false) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        accepted_terms: acceptedTerms,
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

      // Kullanıcı bilgilerini çek
      await get().fetchUser();

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

  // Profil güncelleme
  updateProfile: async (fullName) => {
    set({ isLoading: true });
    try {
      const { data } = await api.put('/auth/me', { full_name: fullName });
      set({ user: data, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Şifre değiştirme
  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true });
    try {
      const { data } = await api.put('/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Çıkış — full reload ile tüm in-memory Zustand store'ları
  // (chat, family, dashboard vs.) eski kullanıcının verisinden temizlenir.
  // Aksi halde yeni hesapla girilince eski hesabın verisi F5'e kadar görünür.
  logout: () => {
    localStorage.removeItem('tanilog_token');
    set({ user: null, token: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  },
}));

export default useAuthStore;
