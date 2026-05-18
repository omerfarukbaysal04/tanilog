import { create } from 'zustand';
import api from '../lib/api';
import { VoiceParseResult } from '../types';

type VoiceState = {
  parseResult: VoiceParseResult | null;
  isLoading: boolean;
  transcribeAudio: (uri: string) => Promise<string>;
  parseTranscript: (transcript: string, targetDate: string) => Promise<VoiceParseResult>;
  clearResult: () => void;
};

const useVoiceStore = create<VoiceState>((set) => ({
  parseResult: null,
  isLoading: false,

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
