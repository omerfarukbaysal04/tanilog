import { create } from 'zustand';
import api from '../lib/api';
import { Notification } from '../types';

type NotificationState = {
  items: Notification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id: number | string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      set({ items: data });
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    await api.post(`/notifications/${id}/read`);
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
  },

  markAllRead: async () => {
    await api.post('/notifications/read-all');
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
  },
}));

export default useNotificationStore;
