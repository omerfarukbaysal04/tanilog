import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

export default function FamilyLayout() {
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
      <Stack.Screen name="index" />
      <Stack.Screen name="add-member" />
      <Stack.Screen name="member" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}
