import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerTintColor: colors.teal300,
        headerTitle: '',
        contentStyle: { backgroundColor: colors.navy950 },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="timeline" />
      <Stack.Screen name="ai-analysis" />
      <Stack.Screen name="doctor-prep" />
      <Stack.Screen name="voice" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
