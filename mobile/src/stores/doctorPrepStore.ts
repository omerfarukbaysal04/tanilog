import { create } from 'zustand';
import { Share } from 'react-native';
import api from '../lib/api';
import { DoctorPrepReport, SavedDoctorReport } from '../types';

type DoctorPrepState = {
  report: DoctorPrepReport | null;
  savedReports: SavedDoctorReport[];
  isGenerating: boolean;
  isLoadingSaved: boolean;
  isSaving: boolean;
  error: string | null;
  createReport: (specialty: string) => Promise<void>;
  fetchSavedReports: () => Promise<void>;
  saveReport: (title: string) => Promise<void>;
  shareReport: (reportId: number) => Promise<void>;
  clearError: () => void;
};

const useDoctorPrepStore = create<DoctorPrepState>((set, get) => ({
  report: null,
  savedReports: [],
  isGenerating: false,
  isLoadingSaved: false,
  isSaving: false,
  error: null,

  createReport: async (specialty) => {
    set({ isGenerating: true, error: null, report: null });
    try {
      const { data } = await api.post<DoctorPrepReport>('/ai/doctor-prep', { specialty });
      set({ report: data });
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d.msg || String(d)).join('; ')
        : typeof detail === 'object' && detail !== null
        ? JSON.stringify(detail)
        : e.message;
      set({ error: errorMsg });
    } finally {
      set({ isGenerating: false });
    }
  },

  fetchSavedReports: async () => {
    set({ isLoadingSaved: true });
    try {
      const { data } = await api.get<SavedDoctorReport[]>('/ai/doctor-prep/saved');
      set({ savedReports: data });
    } finally {
      set({ isLoadingSaved: false });
    }
  },

  saveReport: async (title) => {
    const { report } = get();
    if (!report) return;
    set({ isSaving: true });
    try {
      const { data } = await api.post<SavedDoctorReport>('/ai/doctor-prep/save', {
        title,
        report,
        summary: report.summary,
        key_findings: report.key_findings,
        risk_flags: report.risk_flags,
        doctor_questions: report.doctor_questions,
        preparation_checklist: report.preparation_checklist,
      });
      set({ savedReports: [data, ...get().savedReports] });
    } finally {
      set({ isSaving: false });
    }
  },

  shareReport: async (reportId) => {
    const { data } = await api.post<{ share_url: string }>(`/ai/doctor-prep/saved/${reportId}/share`, {
      hours: 24,
    });
    await Share.share({
      message: `TanıLog doktor raporum: ${data.share_url}`,
      title: 'Doktor Hazırlık Raporumu Paylaş',
    });
  },

  clearError: () => set({ error: null }),
}));

export default useDoctorPrepStore;
