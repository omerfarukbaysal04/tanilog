import { create } from 'zustand';
import api from '../lib/api';
import useNotificationStore from './notificationStore';

const useAIStore = create((set, get) => ({
  analyzedDocuments: [],
  crossAnalysis: null,
  healthReport: null,
  savedReports: [],
  isLoadingDocuments: false,
  isAnalyzing: false,
  isGeneratingReport: false,
  isLoadingSaved: false,
  isSavingReport: false,
  error: null,

  fetchAnalyzedDocuments: async () => {
    set({ isLoadingDocuments: true, error: null });
    try {
      const { data } = await api.get('/ai/analyzed-documents');
      set({ analyzedDocuments: data, isLoadingDocuments: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Analiz edilmiş belgeler yüklenemedi.',
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
      useNotificationStore.getState().pushLocal({
        type: 'ai_analysis',
        title: '✦ Çapraz Analiz Hazır',
        body: 'AI çapraz analiz raporu oluşturuldu. Sonuçları görüntülemek için tıkla.',
        route: '/ai',
        priority: 'normal',
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Çapraz analiz oluşturulamadı.';
      set({ error: message, isAnalyzing: false });
      throw new Error(message);
    }
  },

  createHealthReport: async (period) => {
    set({ isGeneratingReport: true, error: null });
    try {
      const { data } = await api.post('/ai/health-report', { period });
      set({ healthReport: data, isGeneratingReport: false });
      const periodLabel = period === 'weekly' ? 'Haftalık' : 'Aylık';
      useNotificationStore.getState().pushLocal({
        type: 'ai_report',
        title: `✦ ${periodLabel} Sağlık Raporu Hazır`,
        body: 'AI sağlık raporu oluşturuldu. Özeti ve önerileri görüntülemek için tıkla.',
        route: '/ai',
        priority: 'important',
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Sağlık raporu oluşturulamadı.';
      set({ error: message, isGeneratingReport: false });
      throw new Error(message);
    }
  },

  saveReport: async ({ title, type, data }) => {
    set({ isSavingReport: true, error: null });
    try {
      // Reuse the doctor-prep save endpoint structure; store under type='ai_report'
      const payload = { title, report: { type, ...data } };
      const response = await api.post('/ai/doctor-prep/save', payload);
      set((state) => ({
        savedReports: [response.data, ...state.savedReports],
        isSavingReport: false,
      }));
      useNotificationStore.getState().pushLocal({
        type: 'ai_report',
        title: '✦ Rapor Kaydedildi',
        body: `"${title}" başlıklı AI raporu kaydedildi.`,
        route: '/ai',
        priority: 'normal',
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Rapor kaydedilemedi.';
      set({ error: message, isSavingReport: false });
      throw new Error(message);
    }
  },

  fetchSavedReports: async () => {
    set({ isLoadingSaved: true });
    try {
      const { data } = await api.get('/ai/doctor-prep/saved');
      set({ savedReports: data, isLoadingSaved: false });
    } catch {
      set({ isLoadingSaved: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAIStore;
