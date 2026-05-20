import { router } from 'expo-router';

/**
 * Araçlar (Tools) tab'ına güvenilir şekilde gider.
 * - router.navigate → Expo Router'da tab switching için doğru yöntem
 * - Fallback: replace → en kötü ihtimalle mevcut ekranı değiştirir
 */
export function goToToolsIndex() {
  // router.navigate mevcut tab'dan başka tab'a geçişte en güvenilir yöntem
  try {
    (router as any).navigate('/(tabs)/tools');
    return;
  } catch { /* ignore */ }

  // Fallback 1: dismissTo (yeni Expo Router sürümleri)
  try {
    const anyRouter = router as any;
    if (typeof anyRouter.dismissTo === 'function') {
      anyRouter.dismissTo('/(tabs)/tools');
      return;
    }
  } catch { /* ignore */ }

  // Fallback 2: replace ile kesin geç
  try {
    router.replace('/(tabs)/tools' as any);
  } catch {
    router.replace('/tools' as any);
  }
}
