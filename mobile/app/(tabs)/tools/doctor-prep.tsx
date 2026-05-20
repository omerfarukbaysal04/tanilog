import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, Field, GlassCard, Muted, PremiumGate, Screen } from '../../../src/components/ui';
import useDoctorPrepStore from '../../../src/stores/doctorPrepStore';
import useAuthStore from '../../../src/stores/authStore';
import { isTTSAvailable, speak } from '../../../src/lib/tts';
import { goToToolsIndex } from '../../../src/lib/navigation';
import { colors } from '../../../src/theme';

const SPECIALTIES: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Aile Hekimi', value: 'family', icon: 'people-outline' },
  { label: 'Dahiliye', value: 'internal', icon: 'medkit-outline' },
  { label: 'Nöroloji', value: 'neurology', icon: 'pulse-outline' },
  { label: 'Kardiyoloji', value: 'cardiology', icon: 'heart-outline' },
];

export default function DoctorPrepScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTIES[0].value);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const { user } = useAuthStore();
  const {
    report,
    savedReports,
    isGenerating,
    isLoadingSaved,
    isSaving,
    isSharingPdf,
    error,
    createReport,
    fetchSavedReports,
    openSavedReport,
    saveReport,
    shareReport,
    shareReportPdf,
    shareCurrentAsPdf,
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
    if (!saveTitle.trim()) return;
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

  const handleSharePdf = async (id: number, title: string) => {
    try {
      await shareReportPdf(id, title);
    } catch (e: any) {
      Alert.alert('PDF paylaşımı başarısız', e.response?.data?.detail || e.message);
    }
  };

  const handleOpenSaved = async (id: number) => {
    try {
      await openSavedReport(id);
    } catch (e: any) {
      Alert.alert('Rapor açılamadı', e.response?.data?.detail || e.message);
    }
  };

  const handleShareFull = async () => {
    if (!report) return;
    const sections = [
      `📋 DOKTOR HAZIRLIK RAPORU`,
      `\n📝 Özet:\n${report.summary}`,
      report.key_findings?.length ? `\n🔑 Kilit Bulgular:\n${report.key_findings.map((f) => `• ${f}`).join('\n')}` : '',
      report.risk_flags?.length ? `\n⚠️ Risk Uyarıları:\n${report.risk_flags.map((f) => `• ${f}`).join('\n')}` : '',
      report.doctor_questions?.length ? `\n❓ Doktora Sorular:\n${report.doctor_questions.map((q) => `• ${q}`).join('\n')}` : '',
      report.preparation_checklist?.length ? `\n✅ Hazırlık:\n${report.preparation_checklist.map((c) => `• ${c}`).join('\n')}` : '',
      `\n\nTanıLog ile oluşturuldu.`,
    ].filter(Boolean).join('');
    try {
      await Share.share({ message: sections, title: 'Doktor Hazırlık Raporum' });
    } catch {}
  };

  const handleTTS = () => {
    if (!report) return;
    const text = [
      `Özet: ${report.summary}`,
      report.key_findings?.length ? `Kilit Bulgular: ${report.key_findings.join('. ')}` : '',
      report.risk_flags?.length ? `Risk Uyarıları: ${report.risk_flags.join('. ')}` : '',
      report.doctor_questions?.length ? `Doktora Soracağın Sorular: ${report.doctor_questions.join('. ')}` : '',
    ].filter(Boolean).join('. ');
    speak(text);
  };

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <Pressable onPress={goToToolsIndex} style={styles.backBtn}>
          <Ionicons name="arrow-back" color={colors.teal300} size={20} />
          <Text style={styles.backText}>Araçlar</Text>
        </Pressable>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Hazırlık</Text>
          <Text style={styles.headerTitle}>Doktora Hazırlan</Text>
        </View>
      </FadeIn>

      {!user?.is_premium ? (
        <FadeIn delay={60}>
          <PremiumGate
            title="Doktora Hazırlan"
            description="Son 30 günlük sağlık verilerinden uzmanlığa özel bir rapor ürettir. Doktora soracağın sorular, kilit bulgular ve risk uyarıları otomatik çıkarılır."
            icon="medical"
            bullets={[
              'Uzmanlığa özel (Aile, Dahiliye, Nöroloji, Kardiyoloji)',
              'AI ile doktor soruları + risk uyarıları',
              'Rapor kaydet ve paylaş',
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
      <FadeIn delay={120}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="medical-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Uzmanlık Alanı</Text>
          </View>
          <View style={styles.pillGrid}>
            {SPECIALTIES.map((spec) => {
              const active = selectedSpecialty === spec.value;
              return (
                <Pressable
                  key={spec.value}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedSpecialty(spec.value)}
                >
                  <Ionicons name={spec.icon} color={active ? colors.teal300 : colors.navy400} size={14} />
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{spec.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <AppButton
            title="Rapor Oluştur"
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={!user?.is_premium}
            icon={<Ionicons name="sparkles-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>
      )}

      {user?.is_premium && report && (
        <>
          <FadeIn delay={0}>
            <GlassCard accent="teal">
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="document-text-outline" color={colors.teal300} size={16} />
                </View>
                <Text style={styles.cardTitle}>Rapor Özeti</Text>
              </View>
              <Text style={styles.summary}>{report.summary}</Text>
              {/* Aksiyon butonları */}
              <View style={styles.actionRow}>
                {isTTSAvailable() && (
                  <Pressable onPress={handleTTS} style={styles.actionBtn}>
                    <Ionicons name="volume-high-outline" color={colors.teal300} size={16} />
                    <Text style={styles.actionBtnText}>Sesli Oku</Text>
                  </Pressable>
                )}
                <Pressable onPress={handleShareFull} style={styles.actionBtn}>
                  <Ionicons name="share-outline" color={colors.teal300} size={16} />
                  <Text style={styles.actionBtnText}>Metin Paylaş</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    try { await shareCurrentAsPdf(); } catch (e: any) { Alert.alert('PDF Paylaşım', e.message); }
                  }}
                  style={[styles.actionBtn, isSharingPdf && { opacity: 0.6 }]}
                  disabled={isSharingPdf}
                >
                  <Ionicons name="document-attach-outline" color={colors.teal300} size={16} />
                  <Text style={styles.actionBtnText}>{isSharingPdf ? 'Hazırlanıyor...' : 'PDF Kaydet'}</Text>
                </Pressable>
              </View>
            </GlassCard>
          </FadeIn>

          {report.key_findings?.length > 0 && (
            <FadeIn delay={60}>
              <GlassCard>
                <BulletList title="Kilit Bulgular" items={report.key_findings} icon="key-outline" color={colors.teal300} />
              </GlassCard>
            </FadeIn>
          )}

          {report.risk_flags?.length > 0 && (
            <FadeIn delay={120}>
              <GlassCard accent="red">
                <BulletList title="Risk Uyarıları" items={report.risk_flags} icon="warning-outline" color={colors.red} />
              </GlassCard>
            </FadeIn>
          )}

          {report.doctor_questions?.length > 0 && (
            <FadeIn delay={180}>
              <GlassCard accent="yellow">
                <BulletList title="Doktora Soracağın Sorular" items={report.doctor_questions} icon="help-circle-outline" color={colors.yellow} />
              </GlassCard>
            </FadeIn>
          )}

          {report.preparation_checklist?.length > 0 && (
            <FadeIn delay={240}>
              <GlassCard>
                <BulletList title="Hazırlık Listesi" items={report.preparation_checklist} icon="checkbox-outline" color={colors.blueLight} />
              </GlassCard>
            </FadeIn>
          )}

          <FadeIn delay={300}>
            {showSaveForm ? (
              <GlassCard>
                <Field
                  label="Rapor Başlığı"
                  value={saveTitle}
                  onChangeText={setSaveTitle}
                  placeholder="Örn: Kardiyoloji Kontrolü Ocak 2026"
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <AppButton title="İptal" variant="secondary" onPress={() => setShowSaveForm(false)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton title="Kaydet" onPress={handleSave} loading={isSaving} />
                  </View>
                </View>
              </GlassCard>
            ) : (
              <AppButton
                title="Raporu Kaydet"
                variant="secondary"
                onPress={() => setShowSaveForm(true)}
                icon={<Ionicons name="bookmark-outline" color={colors.white} size={18} />}
              />
            )}
          </FadeIn>
        </>
      )}

      {user?.is_premium && savedReports.length > 0 && (
        <FadeIn delay={360}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="bookmarks-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Kaydedilen Raporlar</Text>
            </View>
            {isLoadingSaved ? (
              <Muted>Yükleniyor...</Muted>
            ) : (
              savedReports.map((saved, i) => (
                <Pressable key={saved.id} onPress={() => handleOpenSaved(saved.id)} style={[styles.savedRow, i > 0 && styles.savedDivider]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.savedTitle} numberOfLines={1}>{saved.title}</Text>
                    <Muted>{new Date(saved.created_at).toLocaleDateString('tr-TR')}</Muted>
                  </View>
                  <View style={styles.savedActions}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleSharePdf(saved.id, saved.title);
                      }}
                      style={styles.shareBtn}
                    >
                      <Ionicons name="document-attach-outline" color={colors.teal300} size={18} />
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleShare(saved.id);
                      }}
                      style={styles.shareBtn}
                    >
                      <Ionicons name="share-outline" color={colors.teal300} size={18} />
                    </Pressable>
                  </View>
                </Pressable>
              ))
            )}
          </GlassCard>
        </FadeIn>
      )}
    </Screen>
  );
}

function BulletList({ title, items, icon, color }: { title: string; items: string[]; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} color={color} size={14} />
        <Text style={[styles.listTitle, { color }]}>{title}</Text>
      </View>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
    paddingTop: 12,
  },
  backText: {
    color: colors.teal300,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: {
    color: colors.teal300,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  header: { paddingTop: 4, paddingBottom: 4, gap: 4 },
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
  errorText: { color: '#fecaca', fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderColor: 'rgba(159,179,200,0.12)',
    borderWidth: 1,
    backgroundColor: 'rgba(20,40,58,0.55)',
  },
  pillActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  pillText: { color: colors.navy300, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  pillTextActive: { color: colors.teal300, fontFamily: 'Poppins_700Bold' },
  summary: { color: colors.navy100, fontSize: 13, lineHeight: 20, fontFamily: 'Poppins_400Regular' },
  listTitle: { fontFamily: 'Poppins_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingLeft: 2 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  bulletText: { color: colors.navy100, fontSize: 13, lineHeight: 19, flex: 1, fontFamily: 'Poppins_400Regular' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  savedDivider: { borderTopWidth: 1, borderTopColor: 'rgba(159,179,200,0.08)' },
  savedTitle: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 13 },
  savedActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
