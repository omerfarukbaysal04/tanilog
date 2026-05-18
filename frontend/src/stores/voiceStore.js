import { create } from 'zustand';
import api from '../lib/api';

const useVoiceStore = create((set) => ({
  usage: null,
  parseResult: null,
  isLoading: false,
  error: null,

  fetchUsage: async () => {
    try {
      const { data } = await api.get('/voice/usage');
      set({ usage: data });
      return data;
    } catch (error) {
      set({ error });
      throw error;
    }
  },

  parseTranscript: async ({ transcript, targetDate }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/voice/parse', {
        transcript,
        target_date: targetDate,
      });
      set({ parseResult: data, usage: data.usage, isLoading: false });
      return data;
    } catch (error) {
      set({ error, isLoading: false });
      throw error;
    }
  },

  transcribeAudio: async (audioBlob) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-input.webm');
      const { data } = await api.post('/voice/transcribe', formData);
      set({ isLoading: false });
      return data.transcript;
    } catch (error) {
      set({ error, isLoading: false });
      throw error;
    }
  },

  clearResult: () => set({ parseResult: null, error: null }),
}));

export default useVoiceStore;
