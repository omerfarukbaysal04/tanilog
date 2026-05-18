import { create } from 'zustand';
import api, { API_URL } from '../lib/api';
import { getToken } from '../lib/token';
import { DocumentItem } from '../types';

export type UploadAsset = {
  uri: string;
  name: string;
  mimeType: string;
};

type DocumentState = {
  documents: DocumentItem[];
  isLoading: boolean;
  uploading: boolean;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (asset: UploadAsset, category: string, notes?: string) => Promise<void>;
  analyzeDocument: (id: number) => Promise<any>;
  fileUrl: (id: number) => string;
  authHeaders: () => Promise<Record<string, string>>;
};

const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoading: false,
  uploading: false,

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<DocumentItem[]>('/documents');
      set({ documents: data });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (asset, category, notes) => {
    set({ uploading: true });
    try {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
      } as any);
      form.append('category', category);
      if (notes) form.append('notes', notes);

      await api.post('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await get().fetchDocuments();
    } finally {
      set({ uploading: false });
    }
  },

  analyzeDocument: async (id) => {
    const { data } = await api.post(`/documents/${id}/analyze`);
    return data;
  },

  fileUrl: (id) => `${API_URL}/documents/${id}/file`,

  authHeaders: async () => {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  },
}));

export default useDocumentStore;
