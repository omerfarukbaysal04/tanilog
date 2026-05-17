import { create } from 'zustand';
import api from '../lib/api';

const useDashboardStore = create((set) => ({
  summary: null,
  searchResults: [],
  isLoading: false,
  isSearching: false,
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

  search: async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      set({ searchResults: [], isSearching: false });
      return [];
    }

    set({ isSearching: true });
    try {
      const { data } = await api.get('/dashboard/search', { params: { q: trimmed } });
      set({ searchResults: data.results || [], isSearching: false });
      return data.results || [];
    } catch (error) {
      const message = error.response?.data?.detail || 'Arama yapılamadı.';
      set({ error: message, isSearching: false });
      throw new Error(message);
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),
}));

export default useDashboardStore;
