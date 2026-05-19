import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppLogo, FadeIn, Field, GlassCard, LinearGradient, Muted, Screen } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const pwOk = password.length >= 8;

  return (
    <Screen withOrbs>
      <View style={{ height: 20 }} />

      <Pressable onPress={() => router.push('/landing')} style={styles.backBtn}>
        <Ionicons name="arrow-back" color={colors.white} size={20} />
        <Text style={styles.backText}>Ana Sayfa</Text>
      </Pressable>

      <FadeIn delay={0} style={styles.brandSection}>
        <AppLogo size="md" />
        <Text style={styles.brand}>TanıLog'a Katıl</Text>
        <Text style={styles.tagline}>Sağlık yolculuğun başlıyor</Text>
      </FadeIn>

      <FadeIn delay={150}>
        <GlassCard variant="elevated">
          <LinearGradient
            colors={['#2dd4bf', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopBorder}
          />
          <Text style={styles.cardTitle}>Yeni Hesap Oluştur</Text>

          <Field
            label="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Adın Soyadın"
            icon={<Ionicons name="person-outline" color={colors.navy400} size={18} />}
          />

          <Field
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="ornek@mail.com"
            icon={<Ionicons name="mail-outline" color={colors.navy400} size={18} />}
          />

          <View>
            <Field
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="En az 8 karakter"
              icon={<Ionicons name="lock-closed-outline" color={colors.navy400} size={18} />}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={colors.navy400} size={18} />
            </Pressable>
            {password.length > 0 && (
              <View style={styles.pwHintRow}>
                <Ionicons
                  name={pwOk ? 'checkmark-circle' : 'alert-circle-outline'}
                  color={pwOk ? colors.teal300 : colors.yellow}
                  size={14}
                />
                <Text style={[styles.pwHint, { color: pwOk ? colors.teal300 : colors.yellow }]}>
                  {pwOk ? 'Şifre yeterli' : 'En az 8 karakter girin'}
                </Text>
              </View>
            )}
          </View>

          <Muted>Kayıt olarak KVKK, gizlilik ve kullanım şartlarını kabul etmiş olursun.</Muted>

          <AppButton
            title="Hesap Oluştur"
            onPress={handleRegister}
            loading={isLoading}
            disabled={!fullName || !email || !pwOk}
            size="lg"
            icon={<Ionicons name="checkmark-circle-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      <FadeIn delay={300}>
        <Text style={styles.signupRow}>
          Zaten hesabın var mı?{' '}
          <Link href="/login" style={styles.signupLink}>
            Giriş yap
          </Link>
        </Text>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandSection: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(29,59,79,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.12)',
  },
  backText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  brand: {
    color: colors.white,
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  tagline: {
    color: colors.teal300,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginTop: -4,
  },
  cardTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
    marginBottom: 4,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 32,
    padding: 4,
  },
  pwHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  pwHint: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  signupRow: {
    color: colors.navy300,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginTop: 10,
  },
  signupLink: {
    color: colors.teal300,
    fontFamily: 'Poppins_700Bold',
  },
});
