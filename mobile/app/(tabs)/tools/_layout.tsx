import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.white,
        contentStyle: { backgroundColor: colors.navy950 },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="timeline" options={{ title: 'Zaman Çizelgesi' }} />
      <Stack.Screen name="search" options={{ title: 'Arama' }} />
      <Stack.Screen name="ai-analysis" options={{ title: 'AI Analiz' }} />
      <Stack.Screen name="doctor-prep" options={{ title: 'Doktora Hazırlan' }} />
    </Stack>
  );
}
