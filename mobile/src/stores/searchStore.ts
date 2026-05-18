import { create } from 'zustand';
import api from '../lib/api';
import { SearchResult } from '../types';

type SearchParams = {
  q: string;
  category?: string;
  risky_only?: boolean;
};

type SearchState = {
  results: SearchResult[];
  isLoading: boolean;
  search: (params: SearchParams) => Promise<void>;
  clear: () => void;
};

const useSearchStore = create<SearchState>((set) => ({
  results: [],
  isLoading: false,

  search: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<SearchResult[]>('/search', { params });
      set({ results: data });
    } finally {
      set({ isLoading: false });
    }
  },

  clear: () => set({ results: [] }),
}));

export default useSearchStore;
