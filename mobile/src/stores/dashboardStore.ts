import { create } from 'zustand';
import api from '../lib/api';

type DashboardSummary = {
  counts: Record<string, number>;
  today: Record<string, number>;
  activities: Array<{ kind: string; title: string; description: string; created_at: string }>;
  data_quality: Array<{ kind: string; title: string; description: string }>;
};

type DashboardState = {
  summary: DashboardSummary | null;
  isLoading: boolean;
  fetchSummary: () => Promise<void>;
};

const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,

  fetchSummary: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
      set({ summary: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useDashboardStore;
