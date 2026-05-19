import { create } from 'zustand';
import api from '../lib/api';
import { PlanInfo, SubscriptionEvent, SubscriptionStatus } from '../types';

type BillingState = {
  plans: Record<string, PlanInfo>;
  subscription: SubscriptionStatus | null;
  events: SubscriptionEvent[];
  isLoading: boolean;
  isPurchasing: boolean;
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  purchase: (plan: 'monthly' | 'yearly') => Promise<void>;
  cancel: () => Promise<void>;
};

const useBillingStore = create<BillingState>((set) => ({
  plans: {},
  subscription: null,
  events: [],
  isLoading: false,
  isPurchasing: false,

  fetchPlans: async () => {
    const { data } = await api.get<{ plans: Record<string, PlanInfo> }>('/billing/plans');
    set({ plans: data.plans });
  },

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<SubscriptionStatus>('/billing/subscription');
      set({ subscription: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEvents: async () => {
    const { data } = await api.get<{ events: SubscriptionEvent[] }>('/billing/events');
    set({ events: data.events });
  },

  purchase: async (plan) => {
    set({ isPurchasing: true });
    try {
      const { data: checkout } = await api.post<{ session_id: string }>('/billing/checkout', { plan });
      const { data: result } = await api.post<{ subscription: SubscriptionStatus }>(
        '/billing/checkout/complete',
        { session_id: checkout.session_id },
      );
      set({ subscription: result.subscription });
    } finally {
      set({ isPurchasing: false });
    }
  },

  cancel: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<{ subscription: SubscriptionStatus }>('/billing/cancel');
      set({ subscription: data.subscription });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useBillingStore;
