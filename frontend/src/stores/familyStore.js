import { create } from 'zustand';
import api from '../lib/api';

const useFamilyStore = create((set, get) => ({
  members: [],
  activeMember: null,
  entries: [],
  documents: [],
  availableDocuments: [],
  sentInvitations: [],
  receivedInvitations: [],
  sharedAccesses: [],
  sharedSummary: null,
  isLoading: false,
  error: null,

  fetchMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/family/members');
      set((state) => ({
        members: data,
        activeMember: state.activeMember || data[0] || null,
        isLoading: false,
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Aile üyeleri yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  createMember: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/family/members', payload);
      set((state) => ({
        members: [data, ...state.members],
        activeMember: data,
        entries: [],
        documents: [],
        isLoading: false,
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Aile üyesi eklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateMember: async (memberId, payload) => {
    set({ error: null });
    try {
      const { data } = await api.patch(`/family/members/${memberId}`, payload);
      set((state) => ({
        members: state.members.map((member) => (member.id === memberId ? data : member)),
        activeMember: state.activeMember?.id === memberId ? data : state.activeMember,
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Aile üyesi güncellenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteMember: async (memberId) => {
    set({ error: null });
    try {
      await api.delete(`/family/members/${memberId}`);
      set((state) => {
        const nextMembers = state.members.filter((member) => member.id !== memberId);
        return {
          members: nextMembers,
          activeMember: state.activeMember?.id === memberId ? nextMembers[0] || null : state.activeMember,
          entries: state.activeMember?.id === memberId ? [] : state.entries,
          documents: state.activeMember?.id === memberId ? [] : state.documents,
        };
      });
    } catch (error) {
      const message = error.response?.data?.detail || 'Aile üyesi silinemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  openMember: async (member) => {
    set({ activeMember: member, isLoading: true, error: null });
    try {
      const [entriesResponse, documentsResponse] = await Promise.all([
        api.get(`/family/members/${member.id}/entries`),
        api.get(`/family/members/${member.id}/documents`),
      ]);
      set({
        entries: entriesResponse.data,
        documents: documentsResponse.data,
        isLoading: false,
      });
    } catch (error) {
      const message = error.response?.data?.detail || 'Aile üyesi detayları yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchAvailableDocuments: async () => {
    try {
      const { data } = await api.get('/family/documents/available');
      set({ availableDocuments: data });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Belgeler yüklenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  fetchInvitations: async () => {
    set({ error: null });
    try {
      const [sent, received] = await Promise.all([
        api.get('/family/invitations/sent').catch((error) => {
          if (error.response?.status === 403) return { data: [] };
          throw error;
        }),
        api.get('/family/invitations/received'),
      ]);
      set({ sentInvitations: sent.data, receivedInvitations: received.data });
      return { sent: sent.data, received: received.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Davetler yüklenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  sendInvitation: async (payload) => {
    set({ error: null });
    try {
      const { data } = await api.post('/family/invitations', payload);
      set((state) => ({ sentInvitations: [data, ...state.sentInvitations] }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Davet gönderilemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  acceptInvitation: async (token) => {
    set({ error: null });
    try {
      const { data } = await api.post(`/family/invitations/${token}/accept`);
      await get().fetchInvitations();
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Davet kabul edilemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  cancelInvitation: async (invitationId) => {
    set({ error: null });
    try {
      const { data } = await api.post(`/family/invitations/${invitationId}/cancel`);
      set((state) => ({
        sentInvitations: state.sentInvitations.map((invitation) => (
          invitation.id === invitationId ? data : invitation
        )),
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Davet iptal edilemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  fetchSharedAccesses: async () => {
    set({ error: null });
    try {
      const { data } = await api.get('/family/shared-accesses');
      set({ sharedAccesses: data });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Paylaşılan erişimler yüklenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  openSharedAccess: async (accessId, targetDate = null) => {
    set({ isLoading: true, error: null });
    try {
      const url = targetDate
        ? `/family/shared-accesses/${accessId}/summary?target_date=${targetDate}`
        : `/family/shared-accesses/${accessId}/summary`;
      const { data } = await api.get(url);
      set({ sharedSummary: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Paylaşılan kayıtlar yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  createSharedRecord: async (accessId, payload) => {
    set({ error: null });
    try {
      const { data } = await api.post(`/family/shared-accesses/${accessId}/records`, payload);
      await get().openSharedAccess(accessId);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Paylaşılan kullanıcıya kayıt eklenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  createEntry: async (memberId, payload) => {
    set({ error: null });
    try {
      const { data } = await api.post(`/family/members/${memberId}/entries`, payload);
      set((state) => ({ entries: [data, ...state.entries] }));
      await get().fetchMembers();
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Takip kaydı eklenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  updateSharedRecord: async (accessId, category, recordId, payload) => {
    set({ error: null });
    try {
      const { data } = await api.patch(`/family/shared-accesses/${accessId}/records/${category}/${recordId}`, payload);
      await get().openSharedAccess(accessId);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Paylaşılan kayıt güncellenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteEntry: async (memberId, entryId) => {
    set({ error: null });
    try {
      await api.delete(`/family/members/${memberId}/entries/${entryId}`);
      set((state) => ({ entries: state.entries.filter((entry) => entry.id !== entryId) }));
      await get().fetchMembers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Takip kaydı silinemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  linkDocument: async (memberId, documentId) => {
    set({ error: null });
    try {
      await api.post(`/family/members/${memberId}/documents/${documentId}`);
      await get().openMember(get().activeMember);
      await get().fetchAvailableDocuments();
      await get().fetchMembers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Belge bağlanamadı.';
      set({ error: message });
      throw new Error(message);
    }
  },

  unlinkDocument: async (memberId, documentId) => {
    set({ error: null });
    try {
      await api.delete(`/family/members/${memberId}/documents/${documentId}`);
      set((state) => ({ documents: state.documents.filter((document) => document.id !== documentId) }));
      await get().fetchAvailableDocuments();
      await get().fetchMembers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Belge bağlantısı kaldırılamadı.';
      set({ error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useFamilyStore;
