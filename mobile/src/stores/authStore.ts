import { create } from 'zustand';
import api from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/token';
import { User } from '../types';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,

  initAuth: async () => {
    const token = await getToken();
    if (!token) {
      set({ hasHydrated: true, isAuthenticated: false, user: null });
      return;
    }

    try {
      const { data } = await api.get<User>('/auth/me');
      set({ user: data, isAuthenticated: true, hasHydrated: true });
    } catch {
      await clearToken();
      set({ user: null, isAuthenticated: false, hasHydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const body = new URLSearchParams();
      body.append('username', email);
      body.append('password', password);
      const { data } = await api.post<{ access_token: string }>('/auth/login', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      await setToken(data.access_token);
      await get().fetchUser();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        accepted_terms: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUser: async () => {
    const { data } = await api.get<User>('/auth/me');
    set({ user: data, isAuthenticated: true });
  },

  updateProfile: async (fullName) => {
    set({ isLoading: true });
    try {
      const { data } = await api.put<User>('/auth/me', { full_name: fullName });
      set({ user: data });
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true });
    try {
      await api.put('/auth/me/password', { current_password: currentPassword, new_password: newPassword });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await clearToken();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
