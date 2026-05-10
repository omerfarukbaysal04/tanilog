import { create } from 'zustand';
import api from '../lib/api';

const useChatStore = create((set, get) => ({
  sessions: [],
  activeSession: null,
  messages: [],
  followUps: [],
  isLoading: false,
  isSending: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/chat/sessions');
      set({ sessions: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Sohbetler yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  createSession: async (title) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/chat/sessions', { title });
      set((state) => ({
        sessions: [data, ...state.sessions],
        activeSession: data,
        messages: [],
        followUps: [],
        isLoading: false,
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Sohbet oluşturulamadı.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  renameSession: async (sessionId, title) => {
    set({ error: null });
    try {
      const { data } = await api.patch(`/chat/sessions/${sessionId}`, { title });
      set((state) => ({
        activeSession: state.activeSession?.id === sessionId ? data : state.activeSession,
        sessions: state.sessions.map((session) => (session.id === sessionId ? data : session)),
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Sohbet adı güncellenemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteSession: async (sessionId) => {
    set({ error: null });
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      set((state) => ({
        sessions: state.sessions.filter((session) => session.id !== sessionId),
        activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
        messages: state.activeSession?.id === sessionId ? [] : state.messages,
        followUps: state.activeSession?.id === sessionId ? [] : state.followUps,
      }));
    } catch (error) {
      const message = error.response?.data?.detail || 'Sohbet silinemedi.';
      set({ error: message });
      throw new Error(message);
    }
  },

  openSession: async (session) => {
    set({ activeSession: session, isLoading: true, error: null, followUps: [] });
    try {
      const { data } = await api.get(`/chat/sessions/${session.id}/messages`);
      set({ messages: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Sohbet mesajları yüklenemedi.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  sendMessage: async (message) => {
    let session = get().activeSession;
    if (!session) {
      session = await get().createSession(message.slice(0, 60));
    }

    set({ isSending: true, error: null });
    try {
      const { data } = await api.post(`/chat/sessions/${session.id}/messages`, { message });
      set((state) => ({
        activeSession: data.session,
        sessions: [data.session, ...state.sessions.filter((item) => item.id !== data.session.id)],
        messages: [...state.messages, data.user_message, data.assistant_message],
        followUps: data.follow_up_questions || [],
        isSending: false,
      }));
      return data;
    } catch (error) {
      const messageText = error.response?.data?.detail || 'Mesaj gönderilemedi.';
      set({ error: messageText, isSending: false });
      throw new Error(messageText);
    }
  },

  sendAttachment: async ({ file, message = '' }) => {
    let session = get().activeSession;
    if (!session) {
      session = await get().createSession(message || file.name || 'Dosyalı sağlık sohbeti');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);

    set({ isSending: true, error: null });
    try {
      const { data } = await api.post(`/chat/sessions/${session.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        activeSession: data.session,
        sessions: [data.session, ...state.sessions.filter((item) => item.id !== data.session.id)],
        messages: [...state.messages, data.user_message, data.assistant_message],
        followUps: data.follow_up_questions || [],
        isSending: false,
      }));
      return data;
    } catch (error) {
      const messageText = error.response?.data?.detail || 'Dosya gönderilemedi.';
      set({ error: messageText, isSending: false });
      throw new Error(messageText);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useChatStore;
