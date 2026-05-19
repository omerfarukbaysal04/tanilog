import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, EmptyState, FadeIn, GlassCard, Muted, Screen } from '../../../src/components/ui';
import useAuthStore from '../../../src/stores/authStore';
import api from '../../../src/lib/api';
import { colors } from '../../../src/theme';

type InteractionResult = {
  summary: string;
  interactions: string[];
  full_analysis?: string;
  has_critical?: boolean;
};

export default function MedicationInteractionsScreen() {
  const { user } = useAuthStore();
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<InteractionResult>('/ai/medication-interactions', { days });
      setResult(data);
    } catch (e: any) {
      Alert.alert(
        'Etkileşim kontrolü yapılamadı',
        e.response?.data?.detail || 'Premium gerekli olabilir veya yeterli ilaç verisi yok.',
      );
    } finally {
      setLoading(false);
    }
  };

  const isPremium = !!user?.is_premium;

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AI Analiz</Text>
          <Text style={styles.title}>İlaç Etkileşimi</Text>
          <Muted>Son dönem ilaç ve reçetelerinde olası etkileşimleri AI ile analiz et.</Muted>
        </View>
      </FadeIn>

      {!isPremium && (
        <FadeIn delay={60}>
          <GlassCard accent="yellow">
            <View style={styles.premiumRow}>
              <Ionicons name="star" color={colors.yellow} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Premium gerektirir</Text>
                <Muted>İlaç etkileşim kontrolü Premium özelliğidir. Aboneliği aktifleştir.</Muted>
              </View>
            </View>
          </GlassCard>
        </FadeIn>
      )}

      <FadeIn delay={120}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.iconBg}>
              <Ionicons name="shield-checkmark" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Dönem Seçimi</Text>
          </View>

          <View style={styles.pillRow}>
            {[7, 30, 60, 90].map((d) => (
              <PeriodPill key={d} value={d} active={days === d} onPress={() => setDays(d)} />
            ))}
          </View>

          <AppButton
            title={loading ? 'Analiz ediliyor...' : 'Etkileşim Kontrol Et'}
            onPress={handleCheck}
            loading={loading}
            disabled={!isPremium}
            icon={<Ionicons name="scan-circle-outline" color={colors.white} size={18} />}
          />
          <Muted>AI ilaç adlarını, dozları ve zamanlamayı dikkate alarak olası etkileşimleri raporlar.</Muted>
        </GlassCard>
      </FadeIn>

      {result && (
        <FadeIn delay={200}>
          <GlassCard accent={result.has_critical ? 'red' : 'teal'}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, result.has_critical && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                <Ionicons
                  name={result.has_critical ? 'warning' : 'checkmark-circle'}
                  color={result.has_critical ? colors.red : colors.teal300}
                  size={16}
                />
              </View>
              <Text style={styles.cardTitle}>Sonuç</Text>
            </View>

            <Text style={styles.summary}>{result.summary}</Text>

            {result.interactions?.length > 0 && (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Text style={styles.sectionLabel}>Etkileşimler</Text>
                {result.interactions.map((item, i) => (
                  <View key={i} style={styles.interactionRow}>
                    <Ionicons name="alert-circle-outline" color={colors.yellow} size={14} />
                    <Text style={styles.interactionText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.full_analysis && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.sectionLabel}>Detaylı Analiz</Text>
                <Text style={styles.fullText}>{result.full_analysis}</Text>
              </View>
            )}
          </GlassCard>
        </FadeIn>
      )}

      {!result && !loading && (
        <EmptyState
          icon={<Ionicons name="medical-outline" color={colors.teal300} size={28} />}
          title="Henüz analiz yapılmadı"
          description="Yukarıdan dönem seç ve 'Etkileşim Kontrol Et' butonuna bas."
        />
      )}
    </Screen>
  );
}

function PeriodPill({ value, active, onPress }: { value: number; active: boolean; onPress: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <AppButton
        title={`${value}g`}
        variant={active ? 'primary' : 'secondary'}
        size="sm"
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  eyebrow: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  premiumTitle: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  summary: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
  sectionLabel: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: 4,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.25)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  interactionText: {
    flex: 1,
    color: '#fde68a',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 17,
  },
  fullText: {
    color: colors.navy300,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
});
