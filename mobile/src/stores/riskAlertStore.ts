import { create } from 'zustand';
import api from '../lib/api';
import { RiskAlert } from '../types';

type RiskAlertState = {
  alerts: RiskAlert[];
  isLoading: boolean;
  fetchAlerts: () => Promise<void>;
  dismissAlert: (id: number) => Promise<void>;
};

const useRiskAlertStore = create<RiskAlertState>((set, get) => ({
  alerts: [],
  isLoading: false,

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<RiskAlert[]>('/risk-alerts');
      set({ alerts: data });
    } finally {
      set({ isLoading: false });
    }
  },

  dismissAlert: async (id) => {
    await api.post(`/risk-alerts/${id}/dismiss`);
    set({ alerts: get().alerts.filter((a) => a.id !== id) });
  },
}));

export default useRiskAlertStore;
