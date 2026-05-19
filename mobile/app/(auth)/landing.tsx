import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppLogo, FadeIn, Muted, Screen } from '../../src/components/ui';
import { colors } from '../../src/theme';

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
};

const FEATURES: Feature[] = [
  {
    icon: 'pulse',
    title: 'Akıllı Sağlık Takibi',
    description: 'Semptom, ilaç, uyku ve beslenmeni tek yerden yönet.',
    accent: 'teal',
  },
  {
    icon: 'document-text',
    title: 'Belge Arşivi',
    description: 'Laboratuvar sonuçlarını yükle, AI ile analiz et.',
    accent: 'blue',
  },
  {
    icon: 'mic',
    title: 'Sesli Asistan',
    description: 'Konuş, AI senin için sağlık kaydı oluştursun.',
    accent: 'purple',
  },
  {
    icon: 'sparkles',
    title: 'AI Doktor Hazırlığı',
    description: 'Randevu öncesi kişiselleştirilmiş rapor al.',
    accent: 'pink',
  },
];

export default function LandingScreen() {
  return (
    <Screen withOrbs>
      <View style={{ height: 40 }} />

      {/* Logo — sadece görsel */}
      <FadeIn delay={0}>
        <View style={styles.logoSection}>
          <AppLogo size="lg" />
        </View>
      </FadeIn>

      {/* Hero */}
      <FadeIn delay={120}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>AI destekli kişisel sağlık asistanın</Text>
          <Muted>
            Sağlık kayıtlarını organize et, belgeleri analiz et, doktor görüşmelerine hazırlan.
            Tüm sağlık geçmişin tek bir yerde.
          </Muted>
        </View>
      </FadeIn>

      {/* Feature cards */}
      <View style={styles.featuresGrid}>
        {FEATURES.map((f, idx) => (
          <FeatureCard key={f.title} feature={f} delay={200 + idx * 80} />
        ))}
      </View>

      {/* CTA */}
      <FadeIn delay={560}>
        <View style={{ gap: 10, marginTop: 6 }}>
          <AppButton
            title="Hemen Başla"
            size="lg"
            onPress={() => router.push('/register')}
            icon={<Ionicons name="rocket-outline" color={colors.white} size={18} />}
          />
          <AppButton
            title="Zaten hesabım var"
            variant="secondary"
            onPress={() => router.push('/login')}
            icon={<Ionicons name="log-in-outline" color={colors.white} size={18} />}
          />
        </View>
      </FadeIn>

      {/* Marka — CTA'nın altında */}
      <FadeIn delay={620}>
        <View style={styles.brandSection}>
          <Text style={styles.brand}>TanıLog</Text>
          <Text style={styles.tagline}>Sağlığını anla, hayatını yönet</Text>
        </View>
      </FadeIn>

      <FadeIn delay={680}>
        <View style={styles.disclaimerBox}>
          <Ionicons name="shield-checkmark-outline" color={colors.teal300} size={14} />
          <Text style={styles.disclaimerText}>
            Verileriniz KVKK kapsamında korunur. Tıbbi tavsiye yerine geçmez.
          </Text>
        </View>
      </FadeIn>
    </Screen>
  );
}

function FeatureCard({ feature, delay }: { feature: Feature; delay: number }) {
  const palette = {
    teal: { bg: 'rgba(15,184,165,0.12)', border: 'rgba(15,184,165,0.3)', icon: colors.teal300 },
    blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: colors.blueLight },
    purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', icon: '#c084fc' },
    pink: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', icon: '#f472b6' },
  }[feature.accent];

  return (
    <FadeIn delay={delay} style={styles.featureCell}>
      <View style={[styles.featureCard, { borderColor: palette.border }]}>
        <View style={[styles.featureIcon, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <Ionicons name={feature.icon} color={palette.icon} size={22} />
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDesc}>{feature.description}</Text>
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  logoSection: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  brandSection: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    paddingBottom: 4,
  },
  brand: {
    color: colors.white,
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.6,
  },
  tagline: {
    color: colors.teal300,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: -4,
  },
  hero: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 28,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginTop: 4,
  },
  featureCell: {
    width: '50%',
    padding: 5,
  },
  featureCard: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    minHeight: 140,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  featureDesc: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  disclaimerText: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    textAlign: 'center',
  },
});
