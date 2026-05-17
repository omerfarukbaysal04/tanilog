import { create } from 'zustand';
import api from '../lib/api';

const useTimelineStore = create((set) => ({
  timeline: null,
  isLoading: false,
  error: null,

  fetchTimeline: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/timeline', { params: { days } });
      set({ timeline: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Zaman çizelgesi yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));

export default useTimelineStore;
