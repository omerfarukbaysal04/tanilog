import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    try {
      await register(email.trim(), password, fullName.trim());
      Alert.alert('Kayıt tamam', 'Şimdi giriş yapabilirsin.');
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Kayıt yapılamadı', error.response?.data?.detail || 'Bilgileri kontrol edin.');
    }
  };

  return (
    <Screen>
      <Title>Kayıt Ol</Title>
      <Card>
        <Field label="Ad soyad" value={fullName} onChangeText={setFullName} />
        <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
        <Muted>Kayıt olarak KVKK, gizlilik ve kullanım şartlarını kabul etmiş olursun.</Muted>
        <AppButton title="Hesap Oluştur" onPress={handleRegister} loading={isLoading} disabled={!fullName || !email || password.length < 8} />
      </Card>
      <Text style={{ color: colors.navy300, textAlign: 'center' }}>
        Zaten hesabın var mı? <Link href="/login" style={{ color: colors.teal300, fontWeight: '800' }}>Giriş yap</Link>
      </Text>
    </Screen>
  );
}
