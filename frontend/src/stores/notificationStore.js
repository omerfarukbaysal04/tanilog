import { create } from 'zustand';
import api from '../lib/api';

let medicationTimers = [];

const readKey = 'tanilog_notification_read_ids';
const firedKey = 'tanilog_notification_fired_ids';
const voiceKey = 'tanilog_voice_notifications';

const getStoredSet = (key) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
  } catch {
    return new Set();
  }
};

const saveStoredSet = (key, value) => {
  localStorage.setItem(key, JSON.stringify([...value]));
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const speakText = (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
};

const browserNotify = (title, body) => {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

const useNotificationStore = create((set, get) => ({
  items: [],
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  voiceEnabled: localStorage.getItem(voiceKey) === 'true',
  isOpen: false,
  isLoading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });
    await get().refresh();
    window.setInterval(() => get().refresh().catch(() => {}), 60000);
  },

  refresh: async () => {
    set({ isLoading: true });
    try {
      const readIds = getStoredSet(readKey);
      const date = todayKey();
      const [summaryResponse, invitationsResponse] = await Promise.all([
        api.get(`/health/daily-summary?date=${date}`).catch(() => ({ data: { medications: [] } })),
        api.get('/family/invitations/received').catch(() => ({ data: [] })),
      ]);

      const medicationItems = (summaryResponse.data.medications || [])
        .filter((item) => item.reminder_enabled && item.reminder_time && !item.is_taken)
        .map((item) => {
          const timeText = item.reminder_time.substring(0, 5);
          return {
            id: `medication-${item.id}-${date}-${timeText}`,
            type: 'medication',
            title: 'İlaç hatırlatma',
            body: `${item.name} (${item.dosage}) alma zamanı: ${timeText}`,
            route: '/health',
            priority: 'normal',
            eventTime: `${date}T${timeText}:00`,
            read: readIds.has(`medication-${item.id}-${date}-${timeText}`),
          };
        });

      const invitationItems = (invitationsResponse.data || []).map((item) => ({
        id: `family-invite-${item.id}`,
        type: 'family_invitation',
        title: 'Aile daveti',
        body: `${item.inviter_name || 'Bir kullanıcı'} seni ${item.relation} olarak aile takibine davet etti.`,
        route: '/family',
        priority: 'important',
        eventTime: item.created_at,
        read: readIds.has(`family-invite-${item.id}`),
      }));

      const manualItems = get().items.filter((item) => item.type === 'system_test');
      const items = [...invitationItems, ...medicationItems, ...manualItems]
        .sort((a, b) => new Date(b.eventTime || 0) - new Date(a.eventTime || 0));

      set({ items, isLoading: false, permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported' });
      get().scheduleMedicationReminders(medicationItems);
      return items;
    } catch {
      set({ isLoading: false });
      return get().items;
    }
  },

  scheduleMedicationReminders: (items) => {
    medicationTimers.forEach((timer) => window.clearTimeout(timer));
    medicationTimers = [];
    const firedIds = getStoredSet(firedKey);

    items.forEach((item) => {
      const delay = new Date(item.eventTime).getTime() - Date.now();
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000 || firedIds.has(item.id)) return;
      const timer = window.setTimeout(() => {
        const latestFired = getStoredSet(firedKey);
        latestFired.add(item.id);
        saveStoredSet(firedKey, latestFired);
        get().deliver(item);
      }, delay);
      medicationTimers.push(timer);
    });
  },

  deliver: (item) => {
    browserNotify(item.title, item.body);
    if (get().voiceEnabled) speakText(`${item.title}. ${item.body}`);
    set((state) => ({
      items: state.items.map((existing) => existing.id === item.id ? { ...existing, delivered: true } : existing),
    }));
  },

  requestPermission: async () => {
    if (typeof Notification === 'undefined') {
      set({ permission: 'unsupported' });
      return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    set({ permission });
    return permission;
  },

  sendTestNotification: async () => {
    let permission = get().permission;
    if (permission === 'default') permission = await get().requestPermission();
    const item = {
      id: `system-test-${Date.now()}`,
      type: 'system_test',
      title: 'TanıLog test bildirimi',
      body: 'Bildirim merkezi ve sesli hatırlatma çalışıyor.',
      route: '/health',
      priority: 'normal',
      eventTime: new Date().toISOString(),
      read: false,
    };
    browserNotify(item.title, item.body);
    if (get().voiceEnabled) speakText(`${item.title}. ${item.body}`);
    set((state) => ({ items: [item, ...state.items].slice(0, 20), permission }));
  },

  toggleVoice: () => {
    const next = !get().voiceEnabled;
    localStorage.setItem(voiceKey, String(next));
    set({ voiceEnabled: next });
    if (next) speakText('Sesli bildirimler açıldı.');
  },

  setOpen: (isOpen) => set({ isOpen }),

  markRead: (id) => {
    const readIds = getStoredSet(readKey);
    readIds.add(id);
    saveStoredSet(readKey, readIds);
    set((state) => ({
      items: state.items.map((item) => item.id === id ? { ...item, read: true } : item),
    }));
  },

  markAllRead: () => {
    const readIds = getStoredSet(readKey);
    get().items.forEach((item) => readIds.add(item.id));
    saveStoredSet(readKey, readIds);
    set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) }));
  },
}));

export default useNotificationStore;
