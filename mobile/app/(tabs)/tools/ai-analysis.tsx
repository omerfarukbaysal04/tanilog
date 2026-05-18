import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppButton, Card, Muted, Screen, Title } from '../../../src/components/ui';
import useAIStore from '../../../src/stores/aiStore';
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
      Alert.alert('Uyarı', 'Bir belge seçin.');
      return;
    }
    await createCrossAnalysis({ documentId: selectedDocId, days: selectedDays });
  };

  const handleHealthReport = async () => {
    await createHealthReport(selectedPeriod);
  };

  return (
    <Screen>
      <Title>AI Analiz</Title>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Kapat" variant="secondary" onPress={clearError} />
        </View>
      )}

      {/* Çapraz Analiz */}
      <Card>
        <Text style={styles.sectionTitle}>Çapraz Analiz</Text>
        <Muted>Belge bulgularını sağlık kayıtlarınla karşılaştır</Muted>

        {isLoadingDocuments ? (
          <Muted>Belgeler yükleniyor...</Muted>
        ) : analyzedDocuments.length === 0 ? (
          <Muted>Analiz edilmiş belge bulunamadı. Önce bir belge analiz edin.</Muted>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
              {analyzedDocuments.map((doc) => (
                <Pressable
                  key={doc.id}
                  style={[styles.docPill, selectedDocId === doc.id && styles.docPillActive]}
                  onPress={() => setSelectedDocId(doc.id)}
                >
                  <Text style={[styles.docPillText, selectedDocId === doc.id && styles.docPillTextActive]} numberOfLines={1}>
                    {doc.original_filename}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        <View style={styles.pillRow}>
          {DAY_OPTIONS.map((d) => (
            <Pressable
              key={d}
              style={[styles.pill, selectedDays === d && styles.pillActive]}
              onPress={() => setSelectedDays(d)}
            >
              <Text style={[styles.pillText, selectedDays === d && styles.pillTextActive]}>{d} Gün</Text>
            </Pressable>
          ))}
        </View>

        <AppButton title="Analiz Et" onPress={handleCrossAnalysis} loading={isAnalyzing} />
      </Card>

      {crossAnalysis && (
        <Card>
          <Text style={styles.sectionTitle}>Analiz Sonucu</Text>
          {crossAnalysis.has_critical_alert && (
            <View style={styles.criticalAlert}>
              <Text style={styles.criticalText}>Kritik bulgu tespit edildi!</Text>
            </View>
          )}
          <Text style={styles.summary}>{crossAnalysis.summary}</Text>
          {crossAnalysis.linked_findings?.length > 0 && (
            <BulletList title="Bağlantılı Bulgular" items={crossAnalysis.linked_findings} />
          )}
          {crossAnalysis.recommendations?.length > 0 && (
            <BulletList title="Öneriler" items={crossAnalysis.recommendations} />
          )}
          {crossAnalysis.doctor_questions?.length > 0 && (
            <BulletList title="Doktora Sorular" items={crossAnalysis.doctor_questions} />
          )}
        </Card>
      )}

      {/* Sağlık Raporu */}
      <Card>
        <Text style={styles.sectionTitle}>Sağlık Raporu</Text>
        <Muted>Belirtilen dönem için kapsamlı sağlık özeti</Muted>

        <View style={styles.pillRow}>
          {PERIOD_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.pill, selectedPeriod === opt.value && styles.pillActive]}
              onPress={() => setSelectedPeriod(opt.value)}
            >
              <Text style={[styles.pillText, selectedPeriod === opt.value && styles.pillTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <AppButton title="Rapor Oluştur" onPress={handleHealthReport} loading={isGeneratingReport} />
      </Card>

      {healthReport && (
        <Card>
          <Text style={styles.sectionTitle}>Rapor</Text>
          <Text style={styles.summary}>{healthReport.summary}</Text>
          {healthReport.trends?.length > 0 && (
            <BulletList title="Trendler" items={healthReport.trends} />
          )}
          {healthReport.recommendations?.length > 0 && (
            <BulletList title="Öneriler" items={healthReport.recommendations} />
          )}
          {healthReport.doctor_questions?.length > 0 && (
            <BulletList title="Doktora Sorular" items={healthReport.doctor_questions} />
          )}
        </Card>
      )}
    </Screen>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.listTitle}>{title}</Text>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy800,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.teal500,
    borderColor: colors.teal500,
  },
  pillText: {
    color: colors.navy400,
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextActive: {
    color: colors.white,
  },
  docPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy800,
    maxWidth: 180,
  },
  docPillActive: {
    backgroundColor: colors.teal500,
    borderColor: colors.teal500,
  },
  docPillText: {
    color: colors.navy400,
    fontSize: 12,
    fontWeight: '600',
  },
  docPillTextActive: {
    color: colors.white,
  },
  errorCard: {
    backgroundColor: colors.red + '22',
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
  },
  criticalAlert: {
    backgroundColor: colors.red + '22',
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  criticalText: {
    color: colors.red,
    fontWeight: '700',
  },
  summary: {
    color: colors.navy300,
    fontSize: 14,
    lineHeight: 21,
  },
  listTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    color: colors.teal300,
    fontWeight: '700',
  },
  bulletText: {
    color: colors.navy300,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
