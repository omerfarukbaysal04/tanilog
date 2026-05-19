import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

export default function FamilyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.white,
        contentStyle: { backgroundColor: colors.navy950 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Aile Takibi' }} />
      <Stack.Screen name="add-member" options={{ title: 'Üye Ekle' }} />
      <Stack.Screen name="member" options={{ title: 'Üye Detayı' }} />
      <Stack.Screen name="invite" options={{ title: 'Davet Gönder' }} />
    </Stack>
  );
}
