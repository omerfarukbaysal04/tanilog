import { create } from 'zustand';
import api from '../lib/api';

const useBillingStore = create((set, get) => ({
  plans: null,
  subscription: null,
  events: [],
  checkout: null,
  isLoading: false,
  error: null,

  fetchBilling: async () => {
    set({ isLoading: true, error: null });
    try {
      const [plansRes, subscriptionRes, eventsRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/subscription'),
        api.get('/billing/events'),
      ]);
      set({
        plans: plansRes.data.plans,
        subscription: subscriptionRes.data,
        events: eventsRes.data.events || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Abonelik bilgileri alinamadi.',
        isLoading: false,
      });
      throw error;
    }
  },

  createCheckout: async (plan) => {
    set({ isLoading: true, error: null, checkout: null });
    try {
      const { data } = await api.post('/billing/checkout', { plan });
      set({ checkout: data, isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Ödeme oturumu oluşturulamadı.',
        isLoading: false,
      });
      throw error;
    }
  },

  completeCheckout: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/billing/checkout/complete', { session_id: sessionId });
      await get().fetchBilling();
      set({ checkout: null, isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Ödeme tamamlanamadı.',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/billing/cancel');
      await get().fetchBilling();
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Abonelik iptal edilemedi.',
        isLoading: false,
      });
      throw error;
    }
  },
}));

export default useBillingStore;
