import { create } from 'zustand';
import api from '../lib/api';
import { CrossAnalysis, DocumentItem, HealthReport } from '../types';

type AIState = {
  analyzedDocuments: DocumentItem[];
  crossAnalysis: CrossAnalysis | null;
  healthReport: HealthReport | null;
  isLoadingDocuments: boolean;
  isAnalyzing: boolean;
  isGeneratingReport: boolean;
  error: string | null;
  fetchAnalyzedDocuments: () => Promise<void>;
  createCrossAnalysis: (params: { documentId: number; days: number }) => Promise<void>;
  createHealthReport: (period: 'weekly' | 'monthly') => Promise<void>;
  clearError: () => void;
};

const useAIStore = create<AIState>((set) => ({
  analyzedDocuments: [],
  crossAnalysis: null,
  healthReport: null,
  isLoadingDocuments: false,
  isAnalyzing: false,
  isGeneratingReport: false,
  error: null,

  fetchAnalyzedDocuments: async () => {
    set({ isLoadingDocuments: true });
    try {
      const { data } = await api.get<DocumentItem[]>('/ai/analyzed-documents');
      set({ analyzedDocuments: data });
    } finally {
      set({ isLoadingDocuments: false });
    }
  },

  createCrossAnalysis: async ({ documentId, days }) => {
    set({ isAnalyzing: true, error: null, crossAnalysis: null });
    try {
      const { data } = await api.post<CrossAnalysis>('/ai/cross-analysis', {
        document_id: documentId,
        days,
      });
      set({ crossAnalysis: data });
    } catch (e: any) {
      set({ error: e.response?.data?.detail || e.message });
    } finally {
      set({ isAnalyzing: false });
    }
  },

  createHealthReport: async (period) => {
    set({ isGeneratingReport: true, error: null, healthReport: null });
    try {
      const { data } = await api.post<HealthReport>('/ai/health-report', { period });
      set({ healthReport: data });
    } catch (e: any) {
      set({ error: e.response?.data?.detail || e.message });
    } finally {
      set({ isGeneratingReport: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAIStore;
