import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import api from './api';

// expo-notifications native modülünü dinamik olarak yükle.
// Eski dev build'lerde modül bulunmayabilir; bu durumda bildirimler
// sessizce devre dışı kalır, uygulama çökmez.
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Native modül bu build'de mevcut değil
}

let cachedToken: string | null = null;
let responseSubscription: { remove: () => void } | null = null;
let receivedSubscription: { remove: () => void } | null = null;

export function isNotificationsAvailable(): boolean {
  return Notifications !== null;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

async function setupAndroidChannel() {
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TanıLog Bildirimler',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0fb8a5',
      sound: 'default',
    });
  } catch {}
}

/**
 * Expo push token alır. Permission yoksa istemez (önce requestNotificationPermission çağrılmalı).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications) return null;
  if (cachedToken) return cachedToken;
  try {
    await setupAndroidChannel();
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] EAS projectId bulunamadı, push token alınamadı.');
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    cachedToken = tokenData.data;
    return cachedToken;
  } catch (error) {
    console.warn('[push] Token alma başarısız:', error);
    return null;
  }
}

/**
 * Push token'ı backend'e kaydeder. Tek noktadan auth sonrası çağrılır.
 * Permission isteme akışını da içerir.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Notifications) return null;
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const token = await getExpoPushToken();
  if (!token) return null;

  try {
    await api.post('/push/expo/register', { token, platform: Platform.OS });
    return token;
  } catch (error: any) {
    console.warn('[push] Backend kayıt başarısız:', error?.response?.data || error?.message);
    return null;
  }
}

/**
 * Logout sırasında çağrılır. Token'ı backend'den siler.
 */
export async function unregisterPushToken(): Promise<void> {
  if (!cachedToken) return;
  try {
    await api.delete('/push/expo/unregister', { data: { token: cachedToken } });
  } catch {}
}

/**
 * Bildirimleri dinler. Tap olduğunda data.route varsa o ekrana git.
 * RootLayout mount olunca bir kez çağrılır.
 */
export function setupNotificationListeners() {
  if (!Notifications) return;

  // Önceki listener'ları temizle (hot reload için)
  receivedSubscription?.remove();
  responseSubscription?.remove();

  receivedSubscription = Notifications.addNotificationReceivedListener(() => {
    // Foreground'da gelirse setNotificationHandler banner gösterecek
  });

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    const route = data?.route;
    if (typeof route === 'string' && route.length > 0) {
      try {
        // Backend route formatı: /health, /notifications, /family/invitations vb.
        router.push(route as any);
      } catch {
        router.push('/notifications');
      }
    } else {
      router.push('/notifications');
    }
  });
}

export function teardownNotificationListeners() {
  receivedSubscription?.remove();
  responseSubscription?.remove();
  receivedSubscription = null;
  responseSubscription = null;
}

export async function scheduleMedicationReminder(params: {
  medicationName: string;
  dosage: string;
  reminderTime: string;
  identifier?: string;
}): Promise<string | null> {
  if (!Notifications) return null;
  try {
    const [hour, minute] = params.reminderTime.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      identifier: params.identifier,
      content: {
        title: 'İlaç Hatırlatıcı',
        body: `${params.medicationName}${params.dosage ? ` - ${params.dosage}` : ''} alma vakti!`,
        data: { type: 'medication_reminder', name: params.medicationName, route: '/health' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelMedicationReminder(identifier: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}
