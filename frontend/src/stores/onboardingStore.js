import { create } from 'zustand';
import api from '../lib/api';

const useOnboardingStore = create((set) => ({
  state: null,
  isLoading: false,

  fetchOnboarding: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/onboarding');
    set({ state: data, isLoading: false });
    return data;
  },

  completeStep: async (step) => {
    const { data } = await api.post('/onboarding/step', { step, done: true });
    set({ state: data });
    return data;
  },

  skip: async () => {
    const { data } = await api.post('/onboarding/skip');
    set({ state: data });
    return data;
  },
}));

export default useOnboardingStore;
