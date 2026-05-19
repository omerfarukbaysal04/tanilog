import { create } from 'zustand';
import api from '../lib/api';
import { VoiceParseResult } from '../types';

export type VoiceUsage = {
  limit: number;          // -1 = sınırsız
  used_today: number;
  remaining: number | null;
  is_premium: boolean;
};

type VoiceState = {
  parseResult: VoiceParseResult | null;
  usage: VoiceUsage | null;
  isLoading: boolean;
  transcribeAudio: (uri: string) => Promise<string>;
  parseTranscript: (transcript: string, targetDate: string) => Promise<VoiceParseResult>;
  fetchUsage: () => Promise<void>;
  clearResult: () => void;
};

const useVoiceStore = create<VoiceState>((set) => ({
  parseResult: null,
  usage: null,
  isLoading: false,

  fetchUsage: async () => {
    try {
      const { data } = await api.get<VoiceUsage>('/voice/usage');
      set({ usage: data });
    } catch {}
  },

  transcribeAudio: async (uri) => {
    set({ isLoading: true });
    try {
      const form = new FormData();
      form.append('file', {
        uri,
        name: 'voice-input.m4a',
        type: 'audio/m4a',
      } as any);
      const { data } = await api.post<{ transcript: string }>('/voice/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.transcript;
    } finally {
      set({ isLoading: false });
    }
  },

  parseTranscript: async (transcript, targetDate) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<VoiceParseResult>('/voice/parse', {
        transcript,
        target_date: targetDate,
      });
      set({ parseResult: data });
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  clearResult: () => set({ parseResult: null }),
}));

export default useVoiceStore;
