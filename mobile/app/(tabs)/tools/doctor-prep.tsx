import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../../src/components/ui';
import useDoctorPrepStore from '../../../src/stores/doctorPrepStore';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

const SPECIALTIES = ['Aile Hekimi', 'Dahiliye', 'Nöroloji', 'Kardiyoloji'];

export default function DoctorPrepScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTIES[0]);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const { user } = useAuthStore();
  const {
    report,
    savedReports,
    isGenerating,
    isLoadingSaved,
    isSaving,
    error,
    createReport,
    fetchSavedReports,
    saveReport,
    shareReport,
    clearError,
  } = useDoctorPrepStore();

  useFocusEffect(
    useCallback(() => {
      fetchSavedReports().catch(() => {});
    }, [fetchSavedReports]),
  );

  const handleGenerate = async () => {
    if (!user?.is_premium) {
      Alert.alert('Premium Gerekli', 'Bu özellik Premium üyelere özeldir.');
      return;
    }
    try {
      await createReport(selectedSpecialty);
    } catch (e: any) {
      Alert.alert('Rapor oluşturulamadı', e.message);
    }
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('Hata', 'Rapor başlığı girin.');
      return;
    }
    try {
      await saveReport(saveTitle.trim());
      setSaveTitle('');
      setShowSaveForm(false);
      Alert.alert('Başarılı', 'Rapor kaydedildi.');
    } catch (e: any) {
      Alert.alert('Kayıt başarısız', e.message);
    }
  };

  const handleShare = async (id: number) => {
    try {
      await shareReport(id);
    } catch (e: any) {
      Alert.alert('Paylaşım başarısız', e.message);
    }
  };

  return (
    <Screen>
      <Title>Doktora Hazırlan</Title>
      <Muted>Randevunuz için AI destekli hazırlık raporu oluşturun</Muted>

      {!user?.is_premium && (
        <View style={styles.premiumGate}>
          <Text style={styles.premiumGateTitle}>Premium Özellik</Text>
          <Muted>Doktor hazırlık raporları Premium üyelere özeldir. Sınırsız rapor oluşturmak için Premium'a geçin.</Muted>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Kapat" variant="secondary" onPress={clearError} />
        </View>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Uzmanlık Alanı</Text>
        <View style={styles.pillGrid}>
          {SPECIALTIES.map((spec) => (
            <Pressable
              key={spec}
              style={[styles.pill, selectedSpecialty === spec && styles.pillActive]}
              onPress={() => setSelectedSpecialty(spec)}
            >
              <Text style={[styles.pillText, selectedSpecialty === spec && styles.pillTextActive]}>{spec}</Text>
            </Pressable>
          ))}
        </View>
        <AppButton
          title="Rapor Oluştur"
          onPress={handleGenerate}
          loading={isGenerating}
          disabled={!user?.is_premium}
        />
      </Card>

      {report && (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Özet</Text>
            <Text style={styles.summary}>{report.summary}</Text>
          </Card>

          {report.key_findings?.length > 0 && (
            <Card>
              <BulletList title="Kilit Bulgular" items={report.key_findings} color={colors.teal300} />
            </Card>
          )}

          {report.risk_flags?.length > 0 && (
            <Card>
              <BulletList title="Risk Uyarıları" items={report.risk_flags} color={colors.red} />
            </Card>
          )}

          {report.doctor_questions?.length > 0 && (
            <Card>
              <BulletList title="Doktora Soracağınız Sorular" items={report.doctor_questions} color={colors.yellow} />
            </Card>
          )}

          {report.preparation_checklist?.length > 0 && (
            <Card>
              <BulletList title="Hazırlık Listesi" items={report.preparation_checklist} color={colors.navy300} />
            </Card>
          )}

          {showSaveForm ? (
            <Card>
              <Field
                label="Rapor Başlığı"
                value={saveTitle}
                onChangeText={setSaveTitle}
                placeholder="Örn: Kardiyoloji Kontrolü Ocak 2025"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppButton title="İptal" variant="secondary" onPress={() => setShowSaveForm(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton title="Kaydet" onPress={handleSave} loading={isSaving} />
                </View>
              </View>
            </Card>
          ) : (
            <AppButton title="Raporu Kaydet" variant="secondary" onPress={() => setShowSaveForm(true)} />
          )}
        </>
      )}

      {savedReports.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>Kaydedilen Raporlar</Text>
          {isLoadingSaved ? (
            <Muted>Yükleniyor...</Muted>
          ) : (
            savedReports.map((saved) => (
              <View key={saved.id} style={styles.savedCard}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.savedTitle}>{saved.title}</Text>
                  <Muted>{saved.summary?.slice(0, 80)}...</Muted>
                  <Muted>{new Date(saved.created_at).toLocaleDateString('tr-TR')}</Muted>
                </View>
                <AppButton
                  title="Paylaş"
                  variant="secondary"
                  onPress={() => handleShare(saved.id)}
                />
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

function BulletList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.listTitle, { color }]}>{title}</Text>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color }]}>•</Text>
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
  premiumGate: {
    backgroundColor: colors.teal500 + '15',
    borderColor: colors.teal500,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  premiumGateTitle: {
    color: colors.teal300,
    fontWeight: '800',
    fontSize: 15,
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
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy800,
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
  summary: {
    color: colors.navy300,
    fontSize: 14,
    lineHeight: 21,
  },
  listTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontWeight: '700',
    fontSize: 16,
  },
  bulletText: {
    color: colors.navy300,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  savedCard: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
