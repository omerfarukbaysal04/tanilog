import { create } from 'zustand';
import api from '../lib/api';

const useSettingsStore = create((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/settings');
      set({ settings: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Ayarlar yuklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateSettings: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await api.put('/settings', payload);
      set({ settings: data, isSaving: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Ayarlar kaydedilemedi.';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  exportAccountData: async () => {
    const { data } = await api.get('/settings/export');
    return data;
  },

  deleteAccount: async (password, confirmation) => {
    await api.delete('/settings/account', { data: { password, confirmation } });
  },
}));

export default useSettingsStore;
