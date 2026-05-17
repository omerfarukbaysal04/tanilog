import { create } from 'zustand';
import api from '../lib/api';

const useRiskAlertStore = create((set) => ({
  alerts: [],
  isLoading: false,
  error: null,

  fetchAlerts: async (refresh = true) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/risk-alerts', { params: { refresh } });
      set({ alerts: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Risk uyarıları yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  dismissAlert: async (id) => {
    await api.post(`/risk-alerts/${id}/dismiss`);
    set((state) => ({ alerts: state.alerts.filter((item) => item.id !== id) }));
  },
}));

export default useRiskAlertStore;
