import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.white,
        contentStyle: { backgroundColor: colors.navy950 },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Giriş' }} />
      <Stack.Screen name="register" options={{ title: 'Kayıt' }} />
      <Stack.Screen name="legal" options={{ title: 'Yasal Metinler' }} />
    </Stack>
  );
}
