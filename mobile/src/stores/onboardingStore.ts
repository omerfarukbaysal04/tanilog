import { create } from 'zustand';
import api from '../lib/api';

export type OnboardingStep =
  | 'health_profile_done'
  | 'notifications_done'
  | 'first_record_done'
  | 'first_document_done'
  | 'ai_permissions_done';

export type OnboardingState = {
  is_complete: boolean;
  completed_count: number;
  total_count: number;
  steps: Record<OnboardingStep, boolean>;
};

type Store = {
  state: OnboardingState | null;
  isLoading: boolean;
  fetchOnboarding: () => Promise<void>;
  completeStep: (step: OnboardingStep) => Promise<void>;
  skip: () => Promise<void>;
};

const useOnboardingStore = create<Store>((set, get) => ({
  state: null,
  isLoading: false,

  fetchOnboarding: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<OnboardingState>('/onboarding');
      set({ state: data });
    } finally {
      set({ isLoading: false });
    }
  },

  completeStep: async (step) => {
    const { data } = await api.post<OnboardingState>('/onboarding/step', { step, done: true });
    set({ state: data });
  },

  skip: async () => {
    const { data } = await api.post<OnboardingState>('/onboarding/skip');
    set({ state: data });
  },
}));

export default useOnboardingStore;
