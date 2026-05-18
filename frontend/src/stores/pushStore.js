import { create } from 'zustand';
import toast from 'react-hot-toast';
import api from '../lib/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const usePushStore = create((set, get) => ({
  config: null,
  subscriptions: [],
  isLoading: false,

  fetchStatus: async () => {
    set({ isLoading: true });
    const [config, subscriptions] = await Promise.all([
      api.get('/push/config'),
      api.get('/push/subscriptions').catch(() => ({ data: [] })),
    ]);
    set({ config: config.data, subscriptions: subscriptions.data, isLoading: false });
    return { config: config.data, subscriptions: subscriptions.data };
  },

  subscribe: async () => {
    const { config } = get();
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Bu tarayıcı Web Push desteklemiyor.');
      return null;
    }
    if (!config?.enabled || !config.public_key) {
      toast.error('Web Push anahtarları henüz yapılandırılmamış.');
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Bildirim izni verilmedi.');
      return null;
    }
    const registration = await navigator.serviceWorker.register('/tanilog-sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.public_key),
    });
    const payload = subscription.toJSON();
    await api.post('/push/subscriptions', payload);
    await get().fetchStatus();
    toast.success('Web Push aboneliği açıldı.');
    return payload;
  },

  sendTest: async () => {
    const { data } = await api.post('/push/test');
    if (data.sent > 0) toast.success('Test push gönderildi.');
    else toast('Test bildirimi kaydedildi, Web Push gönderimi yapılandırma bekliyor.');
    return data;
  },
}));

export default usePushStore;
