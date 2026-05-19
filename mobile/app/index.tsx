import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import useAuthStore from '../src/stores/authStore';
import { colors } from '../src/theme';

export default function Index() {
  const { hasHydrated, isAuthenticated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy950 }}>
        <ActivityIndicator color={colors.teal300} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/dashboard' : '/landing'} />;
}
