import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

const useDocumentStore = create((set, get) => ({
  documents: [],
  isLoading: false,
  uploading: false,

  fetchDocuments: async (category = null) => {
    set({ isLoading: true });
    try {
      const url = category && category !== 'all' ? `/documents?category=${category}` : '/documents';
      const { data } = await api.get(url);
      set({ documents: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Belgeler yüklenemedi');
      set({ isLoading: false });
    }
  },

  uploadDocument: async (file, category, notes) => {
    set({ uploading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (notes) formData.append('notes', notes);

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Belge başarıyla yüklendi!');
      get().fetchDocuments();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.detail);
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Belge yüklenirken bir hata oluştu');
      }
      throw error;
    } finally {
      set({ uploading: false });
    }
  },

  deleteDocument: async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Belge silindi');
      get().fetchDocuments();
    } catch (error) {
      toast.error('Belge silinemedi');
    }
  },
}));

export default useDocumentStore;
