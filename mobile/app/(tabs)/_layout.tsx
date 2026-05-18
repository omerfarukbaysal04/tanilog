import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const { hasHydrated, isAuthenticated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy950 }}>
        <ActivityIndicator color={colors.teal300} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.navy900, borderTopColor: colors.navy700 },
        tabBarActiveTintColor: colors.teal300,
        tabBarInactiveTintColor: colors.navy400,
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.white,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={21} /> }} />
      <Tabs.Screen name="health" options={{ title: 'Sağlık', tabBarIcon: ({ color }) => <Ionicons name="heart" color={color} size={21} /> }} />
      <Tabs.Screen name="documents" options={{ title: 'Belgeler', tabBarIcon: ({ color }) => <Ionicons name="document-text" color={color} size={21} /> }} />
      <Tabs.Screen name="voice" options={{ title: 'Sesli', tabBarIcon: ({ color }) => <Ionicons name="mic" color={color} size={21} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" color={color} size={21} /> }} />
    </Tabs>
  );
}
