import { create } from 'zustand';
import api from '../lib/api';

const useDoctorPrepStore = create((set) => ({
  report: null,
  savedReports: [],
  isGenerating: false,
  isLoadingSaved: false,
  isSaving: false,
  error: null,

  createDoctorPrepReport: async () => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/doctor-prep', { days: 30 });
      set({ report: data, isGenerating: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Doktora hazırlık raporu oluşturulamadı.';
      set({ error: message, isGenerating: false });
      throw new Error(message);
    }
  },

  fetchSavedReports: async () => {
    set({ isLoadingSaved: true, error: null });
    try {
      const { data } = await api.get('/ai/doctor-prep/saved');
      set({ savedReports: data, isLoadingSaved: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Kayıtlı raporlar yüklenemedi.';
      set({ error: message, isLoadingSaved: false });
      throw new Error(message);
    }
  },

  loadSavedReport: async (id) => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.get(`/ai/doctor-prep/saved/${id}`);
      set({ report: data, isGenerating: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Kayıtlı rapor açılamadı.';
      set({ error: message, isGenerating: false });
      throw new Error(message);
    }
  },

  saveCurrentReport: async ({ title, report }) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await api.post('/ai/doctor-prep/save', { title, report });
      set((state) => ({
        savedReports: [data, ...state.savedReports],
        report: { ...report, saved_report_id: data.id, saved_title: data.title, saved_at: data.created_at },
        isSaving: false,
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Rapor kaydedilemedi.';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  deleteSavedReport: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/ai/doctor-prep/saved/${id}`);
      set((state) => ({
        savedReports: state.savedReports.filter((item) => item.id !== id),
        report: state.report?.saved_report_id === id ? null : state.report,
      }));
    } catch (error) {
      const message = error.response?.data?.detail || 'Rapor silinemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useDoctorPrepStore;
