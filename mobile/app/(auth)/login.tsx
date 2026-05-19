import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppLogo, FadeIn, Field, GlassCard, LinearGradient, Muted, Screen } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    setErrorMsg(null);
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (error?.code === 'ECONNABORTED') {
        setErrorMsg('Sunucuya ulaşılamıyor. İnternet bağlantını kontrol et.');
      } else if (error?.response?.status === 401 || error?.response?.status === 400) {
        setErrorMsg(detail || 'E-posta veya şifre hatalı.');
      } else {
        setErrorMsg(detail || error?.message || 'Beklenmeyen bir hata oluştu.');
      }
    }
  };

  return (
    <Screen withOrbs>
      <View style={{ height: 30 }} />

      <FadeIn delay={0} style={styles.brandRow}>
        <AppLogo size="sm" />
        <View>
          <Text style={styles.brand}>TanıLog</Text>
          <Text style={styles.tagline}>Sağlığını anla, hayatını yönet</Text>
        </View>
      </FadeIn>

      <FadeIn delay={150}>
        <GlassCard variant="elevated">
          <LinearGradient
            colors={['#2dd4bf', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopBorder}
          />
          <View style={{ gap: 6, marginBottom: 6 }}>
            <Text style={styles.cardTitle}>Tekrar hoş geldin</Text>
            <Muted>Hesabına giriş yap ve sağlık takibine devam et.</Muted>
          </View>

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
              placeholder="••••••••"
              icon={<Ionicons name="lock-closed-outline" color={colors.navy400} size={18} />}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={colors.navy400} size={18} />
            </Pressable>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" color={colors.red} size={16} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <AppButton
            title="Giriş Yap"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!email || !password}
            size="lg"
            icon={<Ionicons name="log-in-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      <FadeIn delay={300}>
        <Text style={styles.signupRow}>
          Hesabın yok mu?{' '}
          <Link href="/register" style={styles.signupLink}>
            Kayıt ol
          </Link>
        </Text>
      </FadeIn>

      <FadeIn delay={400}>
        <Link href="/legal" style={styles.legalLink}>
          Yasal bilgiler ve sorumluluk reddi
        </Link>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 30,
    paddingBottom: 10,
  },
  brand: {
    color: colors.white,
    fontSize: 26,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.6,
  },
  tagline: {
    color: colors.teal300,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: -2,
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
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    padding: 4,
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
  legalLink: {
    color: colors.navy400,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    lineHeight: 18,
  },
});
