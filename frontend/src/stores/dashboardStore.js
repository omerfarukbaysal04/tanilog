import { create } from 'zustand';
import api from '../lib/api';

const useDashboardStore = create((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/dashboard/summary');
      set({ summary: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Dashboard verileri alinamadi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));

export default useDashboardStore;
