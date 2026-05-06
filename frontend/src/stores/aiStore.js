import { create } from 'zustand';
import api from '../lib/api';

const useAIStore = create((set) => ({
  analyzedDocuments: [],
  crossAnalysis: null,
  healthReport: null,
  isLoadingDocuments: false,
  isAnalyzing: false,
  isGeneratingReport: false,
  error: null,

  fetchAnalyzedDocuments: async () => {
    set({ isLoadingDocuments: true, error: null });
    try {
      const { data } = await api.get('/ai/analyzed-documents');
      set({ analyzedDocuments: data, isLoadingDocuments: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Analiz edilmis belgeler yuklenemedi.',
        isLoadingDocuments: false,
      });
    }
  },

  createCrossAnalysis: async ({ documentId, days }) => {
    set({ isAnalyzing: true, error: null });
    try {
      const { data } = await api.post('/ai/cross-analysis', {
        document_id: documentId,
        days,
      });
      set({ crossAnalysis: data, isAnalyzing: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Capraz analiz olusturulamadi.';
      set({ error: message, isAnalyzing: false });
      throw new Error(message);
    }
  },

  createHealthReport: async (period) => {
    set({ isGeneratingReport: true, error: null });
    try {
      const { data } = await api.post('/ai/health-report', { period });
      set({ healthReport: data, isGeneratingReport: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Saglik raporu olusturulamadi.';
      set({ error: message, isGeneratingReport: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAIStore;
