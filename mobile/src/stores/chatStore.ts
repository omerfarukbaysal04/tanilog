import { create } from 'zustand';
import api from '../lib/api';
import { ChatMessage, ChatSession } from '../types';

type ChatState = {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  fetchSessions: () => Promise<void>;
  openSession: (session: ChatSession) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
};

const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSession: null,
  messages: [],
  isLoading: false,
  isSending: false,

  fetchSessions: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<ChatSession[]>('/chat/sessions');
      set({ sessions: data });
    } finally {
      set({ isLoading: false });
    }
  },

  openSession: async (session) => {
    set({ activeSession: session, isLoading: true });
    try {
      const { data } = await api.get<ChatMessage[]>(`/chat/sessions/${session.id}/messages`);
      set({ messages: data });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (message) => {
    set({ isSending: true });
    try {
      let session = get().activeSession;
      if (!session) {
        const created = await api.post<ChatSession>('/chat/sessions', { title: message.slice(0, 60) });
        session = created.data;
        set({ activeSession: session, sessions: [session, ...get().sessions] });
      }
      const { data } = await api.post<{
        session: ChatSession;
        user_message: ChatMessage;
        assistant_message: ChatMessage;
      }>(`/chat/sessions/${session.id}/messages`, { message });
      set((state) => ({
        activeSession: data.session,
        sessions: [data.session, ...state.sessions.filter((item) => item.id !== data.session.id)],
        messages: [...state.messages, data.user_message, data.assistant_message],
      }));
    } finally {
      set({ isSending: false });
    }
  },
}));

export default useChatStore;
