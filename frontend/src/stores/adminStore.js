import { create } from 'zustand';
import api from '../lib/api';

const useAdminStore = create((set) => ({
  overview: null,
  users: [],
  isLoading: false,
  error: null,

  fetchAdminData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [overview, users] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
      ]);
      set({ overview: overview.data, users: users.data, isLoading: false });
      return { overview: overview.data, users: users.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Admin verileri yuklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updatePremium: async (userId, plan = 'monthly') => {
    const { data } = await api.patch(`/admin/users/${userId}/premium`, {
      plan,
      days: plan === 'yearly' ? 365 : 30,
    });
    set((state) => ({
      users: state.users.map((user) => (user.id === userId ? data : user)),
    }));
    return data;
  },

  updateAdmin: async (userId, isAdmin) => {
    const { data } = await api.patch(`/admin/users/${userId}/admin`, { is_admin: isAdmin });
    set((state) => ({
      users: state.users.map((user) => (user.id === userId ? data : user)),
    }));
    return data;
  },
}));

export default useAdminStore;
