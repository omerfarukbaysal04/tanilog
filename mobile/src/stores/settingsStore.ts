import { create } from 'zustand';
import { Share, Alert } from 'react-native';
import api from '../lib/api';
import { clearToken } from '../lib/token';
import { UserSettings } from '../types';

type SettingsState = {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (payload: Partial<UserSettings>) => Promise<void>;
  exportAccountData: () => Promise<void>;
  deleteAccount: (password: string, confirmation: string) => Promise<void>;
};

const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<UserSettings>('/settings');
      set({ settings: data });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (payload) => {
    set({ isSaving: true });
    try {
      const { data } = await api.put<UserSettings>('/settings', payload);
      set({ settings: data });
    } finally {
      set({ isSaving: false });
    }
  },

  exportAccountData: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/settings/export');
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'TanıLog Verilerim',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async (password, confirmation) => {
    await api.delete('/settings/account', {
      data: { password, confirmation },
    });
    await clearToken();
  },
}));

export default useSettingsStore;
