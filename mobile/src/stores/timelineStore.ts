import { create } from 'zustand';
import api from '../lib/api';
import { TimelineGroup } from '../types';

type TimelineState = {
  groups: TimelineGroup[];
  isLoading: boolean;
  fetchTimeline: (days: number) => Promise<void>;
};

const useTimelineStore = create<TimelineState>((set) => ({
  groups: [],
  isLoading: false,

  fetchTimeline: async (days) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<{ groups: TimelineGroup[] }>('/timeline', { params: { days } });
      set({ groups: data.groups ?? data });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useTimelineStore;
