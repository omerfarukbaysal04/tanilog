import { create } from 'zustand';
import api from '../lib/api';

const useSearchStore = create((set) => ({
  results: [],
  isLoading: false,
  error: null,

  search: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/search', { params });
      set({ results: data.results || [], isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Arama yapılamadı.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));

export default useSearchStore;
