import { create } from 'zustand';
import { format } from 'date-fns';
import api from '../lib/api';

const useHealthStore = create((set, get) => ({
  selectedDate: new Date(),
  dailyData: {
    symptoms: [],
    medications: [],
    sleep: [],
    nutrition: [],
  },
  isLoading: false,

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchDailySummary(date);
  },

  fetchDailySummary: async (date) => {
    set({ isLoading: true });
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { data } = await api.get(`/health/daily-summary?date=${formattedDate}`);
      set({ dailyData: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      set({ isLoading: false });
    }
  },

  // Semptom İşlemleri
  addSymptom: async (symptomData) => {
    try {
      await api.post('/health/symptoms', symptomData);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },
  deleteSymptom: async (id) => {
    try {
      await api.delete(`/health/symptoms/${id}`);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },

  // İlaç İşlemleri
  addMedication: async (medicationData) => {
    try {
      await api.post('/health/medications', medicationData);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },
  deleteMedication: async (id) => {
    try {
      await api.delete(`/health/medications/${id}`);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },

  // Uyku İşlemleri
  addSleep: async (sleepData) => {
    try {
      await api.post('/health/sleep', sleepData);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },
  deleteSleep: async (id) => {
    try {
      await api.delete(`/health/sleep/${id}`);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },

  // Beslenme İşlemleri
  addNutrition: async (nutritionData) => {
    try {
      await api.post('/health/nutrition', nutritionData);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },
  deleteNutrition: async (id) => {
    try {
      await api.delete(`/health/nutrition/${id}`);
      get().fetchDailySummary(get().selectedDate);
    } catch (error) {
      throw error;
    }
  },
}));

export default useHealthStore;
