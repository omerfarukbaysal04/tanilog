import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

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
        tabBarStyle: [
          styles.tabBar,
          {
            height: (Platform.OS === 'ios' ? 60 : 60) + Math.max(insets.bottom, 8),
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],
        tabBarActiveTintColor: colors.teal300,
        tabBarInactiveTintColor: colors.navy400,
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 10,
          marginTop: 2,
        },
        tabBarItemStyle: { paddingTop: 6 },
        headerStyle: { backgroundColor: colors.navy900, borderBottomColor: 'rgba(159,179,200,0.08)', borderBottomWidth: 1 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontSize: 17 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Anasayfa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Sağlığım',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Araçlar',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.centerTabIcon}>
              <Ionicons name={focused ? 'apps' : 'apps-outline'} color={focused ? colors.white : color} size={26} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Belgeler',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Asistan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} size={22} />
          ),
        }}
      />

      {/* Stack screens: tab bar'da gizli, header'lı */}
      <Tabs.Screen name="profile" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="billing" options={{ href: null, headerShown: true, title: 'Abonelik' }} />
      <Tabs.Screen name="family" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(11,23,34,0.95)',
    borderTopColor: 'rgba(159,179,200,0.08)',
    borderTopWidth: 1,
  },
  centerTabIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
});
