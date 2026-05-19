import { create } from 'zustand';
import api from '../lib/api';
import { DailySummary } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

export type MedicationCandidate = {
  name: string;
  dosage: string;
  usage?: string;
  notes?: string;
  suggested_time?: string;
  barcode?: string;
  confidence: number;
};

export type MedicationScanResult = {
  summary: string;
  medications: MedicationCandidate[];
  warnings: string[];
  error?: string;
};

type HealthState = {
  selectedDate: string;
  dailyData: DailySummary | null;
  isLoading: boolean;
  setSelectedDate: (date: string) => Promise<void>;
  fetchDailySummary: (date?: string) => Promise<void>;
  addSymptom: (payload: Record<string, any>) => Promise<void>;
  addMedication: (payload: Record<string, any>) => Promise<void>;
  addSleep: (payload: Record<string, any>) => Promise<void>;
  addNutrition: (payload: Record<string, any>) => Promise<void>;
  deleteItem: (kind: 'symptoms' | 'medications' | 'sleep' | 'nutrition', id: number) => Promise<void>;
  markMedicationTaken: (id: number) => Promise<void>;
  scanMedication: (asset: { uri: string; name: string; mimeType: string }) => Promise<MedicationScanResult>;
};

const useHealthStore = create<HealthState>((set, get) => ({
  selectedDate: today(),
  dailyData: null,
  isLoading: false,

  setSelectedDate: async (date) => {
    set({ selectedDate: date });
    await get().fetchDailySummary(date);
  },

  fetchDailySummary: async (date = get().selectedDate) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<DailySummary>(`/health/daily-summary?date=${date}`);
      set({ dailyData: data });
    } finally {
      set({ isLoading: false });
    }
  },

  addSymptom: async (payload) => {
    await api.post('/health/symptoms', payload);
    await get().fetchDailySummary();
  },

  addMedication: async (payload) => {
    await api.post('/health/medications', payload);
    await get().fetchDailySummary();
  },

  addSleep: async (payload) => {
    await api.post('/health/sleep', payload);
    await get().fetchDailySummary();
  },

  addNutrition: async (payload) => {
    await api.post('/health/nutrition', payload);
    await get().fetchDailySummary();
  },

  deleteItem: async (kind, id) => {
    await api.delete(`/health/${kind}/${id}`);
    await get().fetchDailySummary();
  },

  markMedicationTaken: async (id) => {
    await api.patch(`/health/medications/${id}/taken`);
    await get().fetchDailySummary();
  },

  scanMedication: async (asset) => {
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType,
    } as any);
    const { data } = await api.post<MedicationScanResult>('/ai/medication-scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return data;
  },
}));

export default useHealthStore;
