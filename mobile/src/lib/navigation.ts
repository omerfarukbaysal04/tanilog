import { router } from 'expo-router';

export function goToToolsIndex() {
  const anyRouter = router as any;
  try {
    if (typeof anyRouter.dismissTo === 'function') {
      anyRouter.dismissTo('/(tabs)/tools');
      return;
    }
  } catch {}

  try {
    router.replace('/(tabs)/tools' as any);
  } catch {
    router.replace('/tools' as any);
  }
}
