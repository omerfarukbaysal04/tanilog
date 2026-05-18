import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Giriş yapılamadı', error.response?.data?.detail || 'E-posta veya şifre hatalı.');
    }
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>TanıLog</Title>
        <Muted>Sağlığını anla, hayatını yönet.</Muted>
      </View>
      <Card>
        <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
        <AppButton title="Giriş Yap" onPress={handleLogin} loading={isLoading} disabled={!email || !password} />
      </Card>
      <Text style={{ color: colors.navy300, textAlign: 'center' }}>
        Hesabın yok mu? <Link href="/register" style={{ color: colors.teal300, fontWeight: '800' }}>Kayıt ol</Link>
      </Text>
    </Screen>
  );
}
