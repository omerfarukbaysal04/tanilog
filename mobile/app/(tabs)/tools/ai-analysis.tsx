import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, GlassCard, Muted, PremiumGate, Screen } from '../../../src/components/ui';
import useAIStore from '../../../src/stores/aiStore';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

const DAY_OPTIONS = [7, 30, 60];
const PERIOD_OPTIONS = [
  { label: 'Haftalık', value: 'weekly' as const },
  { label: 'Aylık', value: 'monthly' as const },
];

export default function AIAnalysisScreen() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const { user } = useAuthStore();

  const {
    analyzedDocuments,
    crossAnalysis,
    healthReport,
    isLoadingDocuments,
    isAnalyzing,
    isGeneratingReport,
    error,
    fetchAnalyzedDocuments,
    createCrossAnalysis,
    createHealthReport,
    clearError,
  } = useAIStore();

  useFocusEffect(
    useCallback(() => {
      fetchAnalyzedDocuments().catch(() => {});
    }, [fetchAnalyzedDocuments]),
  );

  const handleCrossAnalysis = async () => {
    if (!selectedDocId) {
      Alert.alert('Uyarı', 'Bir belge seç.');
      return;
    }
    await createCrossAnalysis({ documentId: selectedDocId, days: selectedDays });
  };

  const handleHealthReport = async () => {
    await createHealthReport(selectedPeriod);
  };

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>AI Analiz</Text>
          <Text style={styles.headerTitle}>Akıllı İncelemeler</Text>
        </View>
      </FadeIn>

      {!user?.is_premium ? (
        <FadeIn delay={60}>
          <PremiumGate
            title="AI Analiz"
            icon="analytics"
            description="Belgelerini sağlık verilerinle çapraz analiz et veya haftalık/aylık sağlık raporu üret."
            bullets={[
              'Belge çapraz analizi (semptom + lab + ilaç)',
              'Haftalık ve aylık AI sağlık raporu',
              'Trend analizi ve öneriler',
              'Raporları kaydet ve paylaş',
            ]}
          />
        </FadeIn>
      ) : null}

      {user?.is_premium && error && (
        <FadeIn delay={0}>
          <GlassCard accent="red">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="alert-circle" color={colors.red} size={18} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <AppButton title="Kapat" variant="secondary" onPress={clearError} />
          </GlassCard>
        </FadeIn>
      )}

      {user?.is_premium && (
        <>
      {/* Çapraz Analiz */}
      <FadeIn delay={80}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="git-compare-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Çapraz Analiz</Text>
          </View>
          <Muted>Belge bulgularını sağlık kayıtlarınla karşılaştır.</Muted>

          {isLoadingDocuments ? (
            <Muted>Belgeler yükleniyor...</Muted>
          ) : analyzedDocuments.length === 0 ? (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" color={colors.yellow} size={14} />
              <Text style={styles.infoText}>Analiz edilmiş belge yok. Belgeler sekmesinden bir belgeyi AI ile analiz et.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                {analyzedDocuments.map((doc) => {
                  const active = selectedDocId === doc.id;
                  return (
                    <Pressable
                      key={doc.id}
                      style={[styles.docPill, active && styles.docPillActive]}
                      onPress={() => setSelectedDocId(doc.id)}
                    >
                      <Ionicons name="document-text-outline" color={active ? colors.teal300 : colors.navy400} size={13} />
                      <Text style={[styles.docPillText, active && styles.docPillTextActive]} numberOfLines={1}>
                        {doc.original_filename}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View style={styles.pillRow}>
            {DAY_OPTIONS.map((d) => {
              const active = selectedDays === d;
              return (
                <Pressable
                  key={d}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedDays(d)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{d} Gün</Text>
                </Pressable>
              );
            })}
          </View>

          <AppButton
            title="Analiz Et"
            onPress={handleCrossAnalysis}
            loading={isAnalyzing}
            disabled={!selectedDocId}
            icon={<Ionicons name="sparkles-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {crossAnalysis && (
        <FadeIn delay={0}>
          <GlassCard accent={crossAnalysis.has_critical_alert ? 'red' : 'teal'}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="analytics-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Analiz Sonucu</Text>
            </View>

            {/* Hangi belge için yapılmış */}
            {crossAnalysis.document && (
              <View style={styles.docInfoRow}>
                <View style={styles.docInfoIcon}>
                  <Ionicons name="document-text" color={colors.blueLight} size={14} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docInfoLabel}>Analiz edilen belge</Text>
                  <Text style={styles.docInfoName} numberOfLines={1}>
                    {crossAnalysis.document.original_filename}
                  </Text>
                  {crossAnalysis.document.category && (
                    <Text style={styles.docInfoMeta}>{crossAnalysis.document.category}</Text>
                  )}
                </View>
                {crossAnalysis.days && (
                  <View style={styles.daysBadge}>
                    <Text style={styles.daysBadgeText}>{crossAnalysis.days} gün</Text>
                  </View>
                )}
              </View>
            )}

            {crossAnalysis.has_critical_alert && (
              <View style={styles.criticalAlert}>
                <Ionicons name="warning" color={colors.red} size={16} />
                <Text style={styles.criticalText}>Kritik bulgu tespit edildi!</Text>
              </View>
            )}
            <Text style={styles.summary}>{crossAnalysis.summary}</Text>
            {crossAnalysis.linked_findings && crossAnalysis.linked_findings.length > 0 && (
              <BulletList title="Bağlantılı Bulgular" items={crossAnalysis.linked_findings} icon="link-outline" />
            )}
            {crossAnalysis.recommendations && crossAnalysis.recommendations.length > 0 && (
              <BulletList title="Öneriler" items={crossAnalysis.recommendations} icon="bulb-outline" />
            )}
            {crossAnalysis.doctor_questions && crossAnalysis.doctor_questions.length > 0 && (
              <BulletList title="Doktora Sorular" items={crossAnalysis.doctor_questions} icon="help-circle-outline" />
            )}
          </GlassCard>
        </FadeIn>
      )}

      {/* Sağlık Raporu */}
      <FadeIn delay={140}>
        <GlassCard accent="blue">
          <View style={styles.cardHeader}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' }]}>
              <Ionicons name="document-attach-outline" color={colors.blueLight} size={16} />
            </View>
            <Text style={styles.cardTitle}>Sağlık Raporu</Text>
          </View>
          <Muted>Belirtilen dönem için kapsamlı sağlık özeti.</Muted>

          <View style={styles.pillRow}>
            {PERIOD_OPTIONS.map((opt) => {
              const active = selectedPeriod === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedPeriod(opt.value)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <AppButton
            title="Rapor Oluştur"
            onPress={handleHealthReport}
            loading={isGeneratingReport}
            icon={<Ionicons name="document-text-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {healthReport && (
        <FadeIn delay={0}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="reader-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Rapor</Text>
            </View>
            <Text style={styles.summary}>{healthReport.summary}</Text>
            {healthReport.trends?.length > 0 && (
              <BulletList title="Trendler" items={healthReport.trends} icon="trending-up-outline" />
            )}
            {healthReport.recommendations?.length > 0 && (
              <BulletList title="Öneriler" items={healthReport.recommendations} icon="bulb-outline" />
            )}
            {healthReport.doctor_questions && healthReport.doctor_questions.length > 0 && (
              <BulletList title="Doktora Sorular" items={healthReport.doctor_questions} icon="help-circle-outline" />
            )}
          </GlassCard>
        </FadeIn>
      )}
        </>
      )}
    </Screen>
  );
}

function BulletList({ title, items, icon }: { title: string; items: string[]; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} color={colors.teal300} size={13} />
        <Text style={styles.listTitle}>{title}</Text>
      </View>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 4, gap: 4 },
  docInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  docInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoLabel: {
    color: colors.navy400,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  docInfoName: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  docInfoMeta: {
    color: colors.blueLight,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  daysBadge: {
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  daysBadgeText: {
    color: colors.teal300,
    fontSize: 10,
    fontFamily: 'Poppins_800ExtraBold',
  },
  headerEyebrow: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 26,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.12)',
    backgroundColor: 'rgba(20,40,58,0.55)',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  pillText: { color: colors.navy300, fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  pillTextActive: { color: colors.teal300, fontFamily: 'Poppins_700Bold' },
  docPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.12)',
    backgroundColor: 'rgba(20,40,58,0.55)',
    maxWidth: 200,
  },
  docPillActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  docPillText: { color: colors.navy300, fontSize: 11, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  docPillTextActive: { color: colors.teal300 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  infoText: { color: '#fcd34d', fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 17 },
  errorText: { color: '#fecaca', fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  criticalText: { color: '#fecaca', fontFamily: 'Poppins_700Bold', fontSize: 13 },
  summary: { color: colors.navy200, fontSize: 13, lineHeight: 20, fontFamily: 'Poppins_400Regular' },
  listTitle: {
    color: colors.teal300,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingLeft: 2 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.teal500,
    marginTop: 7,
  },
  bulletText: { color: colors.navy100, fontSize: 13, lineHeight: 19, flex: 1, fontFamily: 'Poppins_400Regular' },
});
