import { create } from 'zustand';
import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import api from '../lib/api';
import { API_URL } from '../lib/api';
import { getToken } from '../lib/token';
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
  openSavedReport: (reportId: number) => Promise<void>;
  saveReport: (title: string) => Promise<void>;
  shareReport: (reportId: number) => Promise<void>;
  shareReportPdf: (reportId: number, title?: string) => Promise<void>;
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

  openSavedReport: async (reportId) => {
    set({ isLoadingSaved: true, error: null });
    try {
      const { data } = await api.get<DoctorPrepReport>(`/ai/doctor-prep/saved/${reportId}`);
      set({ report: data });
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      set({ error: typeof detail === 'string' ? detail : e.message });
      throw e;
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
    const { data } = await api.get<DoctorPrepReport>(`/ai/doctor-prep/saved/${reportId}`);
    const sections = [
      'DOKTOR HAZIRLIK RAPORU',
      data.saved_title ? `\n${data.saved_title}` : '',
      data.date_range ? `\nDonem: ${data.date_range.start} - ${data.date_range.end}` : '',
      `\nOzet:\n${data.summary}`,
      data.key_findings?.length ? `\nKilit Bulgular:\n${data.key_findings.map((item) => `- ${item}`).join('\n')}` : '',
      data.risk_flags?.length ? `\nRisk Uyarilari:\n${data.risk_flags.map((item) => `- ${item}`).join('\n')}` : '',
      data.doctor_questions?.length ? `\nDoktora Sorular:\n${data.doctor_questions.map((item) => `- ${item}`).join('\n')}` : '',
      data.preparation_checklist?.length ? `\nHazirlik Listesi:\n${data.preparation_checklist.map((item) => `- ${item}`).join('\n')}` : '',
      '\n\nTaniLog ile olusturuldu.',
    ].filter(Boolean).join('');
    await Share.share({
      message: sections,
      title: 'Doktor Hazırlık Raporumu Paylaş',
    });
  },

  shareReportPdf: async (reportId, title = 'doktor-raporu') => {
    const token = await getToken();
    const safeTitle = title
      .toLowerCase()
      .replace(/[çÇ]/g, 'c')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[ıİ]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's')
      .replace(/[üÜ]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'doktor-raporu';
    const destination = new File(Paths.cache, `${safeTitle}.pdf`);
    const result = await File.downloadFileAsync(
      `${API_URL}/ai/doctor-prep/saved/${reportId}/pdf`,
      destination,
      {
        idempotent: true,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      },
    );
    await Share.share({
      title: `${title}.pdf`,
      url: result.uri,
      message: `Doktor hazırlık raporu PDF: ${result.uri}`,
    });
  },

  clearError: () => set({ error: null }),
}));

export default useDoctorPrepStore;
