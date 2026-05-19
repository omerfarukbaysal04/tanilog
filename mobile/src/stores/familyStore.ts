import { create } from 'zustand';
import api from '../lib/api';
import { FamilyAccess, FamilyHealthEntry, FamilyInvitation, FamilyMember } from '../types';

type FamilyState = {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  entries: FamilyHealthEntry[];
  sentInvitations: FamilyInvitation[];
  receivedInvitations: FamilyInvitation[];
  receivedAccesses: FamilyAccess[];
  isLoading: boolean;
  isSaving: boolean;

  fetchMembers: () => Promise<void>;
  addMember: (data: {
    full_name: string;
    relation: string;
    birth_year?: number | null;
    phone?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;

  selectMember: (member: FamilyMember) => void;
  fetchEntries: (memberId: number) => Promise<void>;
  addEntry: (
    memberId: number,
    data: { entry_date: string; category: string; title: string; severity?: number; details?: string },
  ) => Promise<void>;
  deleteEntry: (memberId: number, entryId: number) => Promise<void>;

  sendInvitation: (data: {
    invitee_email: string;
    relation: string;
    can_view_documents?: boolean;
    can_add_records?: boolean;
    message?: string;
  }) => Promise<void>;
  fetchSentInvitations: () => Promise<void>;
  cancelInvitation: (id: number) => Promise<void>;

  fetchReceivedAccesses: () => Promise<void>;
  revokeAccess: (id: number) => Promise<void>;

  fetchReceivedInvitations: () => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
};

const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  selectedMember: null,
  entries: [],
  sentInvitations: [],
  receivedInvitations: [],
  receivedAccesses: [],
  isLoading: false,
  isSaving: false,

  fetchMembers: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<FamilyMember[]>('/family/members');
      set({ members: data });
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: async (payload) => {
    set({ isSaving: true });
    try {
      const { data } = await api.post<FamilyMember>('/family/members', payload);
      set({ members: [data, ...get().members] });
    } finally {
      set({ isSaving: false });
    }
  },

  deleteMember: async (id) => {
    await api.delete(`/family/members/${id}`);
    set({ members: get().members.filter((m) => m.id !== id) });
  },

  selectMember: (member) => set({ selectedMember: member, entries: [] }),

  fetchEntries: async (memberId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<FamilyHealthEntry[]>(`/family/members/${memberId}/entries`);
      set({ entries: data });
    } finally {
      set({ isLoading: false });
    }
  },

  addEntry: async (memberId, payload) => {
    set({ isSaving: true });
    try {
      const { data } = await api.post<FamilyHealthEntry>(`/family/members/${memberId}/entries`, payload);
      set({ entries: [data, ...get().entries] });
    } finally {
      set({ isSaving: false });
    }
  },

  deleteEntry: async (memberId, entryId) => {
    await api.delete(`/family/members/${memberId}/entries/${entryId}`);
    set({ entries: get().entries.filter((e) => e.id !== entryId) });
  },

  sendInvitation: async (payload) => {
    set({ isSaving: true });
    try {
      const { data } = await api.post<FamilyInvitation>('/family/invitations', {
        can_view_documents: true,
        can_add_records: false,
        ...payload,
      });
      set({ sentInvitations: [data, ...get().sentInvitations] });
    } finally {
      set({ isSaving: false });
    }
  },

  fetchSentInvitations: async () => {
    const { data } = await api.get<FamilyInvitation[]>('/family/invitations/sent');
    set({ sentInvitations: data });
  },

  cancelInvitation: async (id) => {
    await api.post(`/family/invitations/${id}/cancel`);
    set({ sentInvitations: get().sentInvitations.filter((i) => i.id !== id) });
  },

  fetchReceivedAccesses: async () => {
    const { data } = await api.get<FamilyAccess[]>('/family/shared-accesses');
    set({ receivedAccesses: data });
  },

  revokeAccess: async (id) => {
    await api.delete(`/family/shared-accesses/${id}`);
    set({ receivedAccesses: get().receivedAccesses.filter((a) => a.id !== id) });
  },

  fetchReceivedInvitations: async () => {
    const { data } = await api.get<FamilyInvitation[]>('/family/invitations/received');
    set({ receivedInvitations: data });
  },

  acceptInvitation: async (token) => {
    await api.post(`/family/invitations/${token}/accept`);
    // Listeyi yenile
    set({ receivedInvitations: get().receivedInvitations.filter((i) => i.token !== token) });
    await get().fetchReceivedAccesses();
  },

  declineInvitation: async (token) => {
    await api.post(`/family/invitations/${token}/decline`);
    set({ receivedInvitations: get().receivedInvitations.filter((i) => i.token !== token) });
  },
}));

export default useFamilyStore;
