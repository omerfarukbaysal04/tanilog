import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AppButton, FadeIn, Field, GlassCard, Muted, Screen, ToggleRow } from '../../src/components/ui';
import useHealthStore, { MedicationCandidate, MedicationScanResult } from '../../src/stores/healthStore';
import { scheduleMedicationReminder } from '../../src/lib/notifications';
import { colors } from '../../src/theme';

type Kind = 'symptom' | 'medication' | 'sleep' | 'nutrition';

const KIND_META: Record<Kind, { label: string; icon: keyof typeof Ionicons.glyphMap; accent: 'pink' | 'teal' | 'blue' | 'purple' }> = {
  symptom: { label: 'Semptom', icon: 'pulse-outline', accent: 'pink' },
  medication: { label: 'İlaç', icon: 'medkit-outline', accent: 'teal' },
  sleep: { label: 'Uyku', icon: 'moon-outline', accent: 'blue' },
  nutrition: { label: 'Beslenme', icon: 'restaurant-outline', accent: 'purple' },
};

const qualityLabels: Record<string, string> = { bad: 'Kötü', fair: 'Orta', good: 'İyi', excellent: 'Mükemmel' };
const mealLabels: Record<string, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Atıştırmalık' };

export default function HealthScreen() {
  const {
    selectedDate,
    dailyData,
    fetchDailySummary,
    setSelectedDate,
    addSymptom,
    addMedication,
    addSleep,
    addNutrition,
    deleteItem,
    markMedicationTaken,
    scanMedication,
  } = useHealthStore();

  const [kind, setKind] = useState<Kind>('symptom');
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MedicationScanResult | null>(null);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchDailySummary().catch((error) => Alert.alert('Sağlık verisi alınamadı', error.message));
    }, [fetchDailySummary]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDailySummary();
    } finally {
      setRefreshing(false);
    }
  };

  const handleScanFile = async (asset: { uri: string; name: string; mimeType: string }) => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanMedication(asset);
      setScanResult(result);
      if (!result.medications?.length) {
        Alert.alert('Bulunamadı', 'Görselde ilaç adayı bulunamadı. Daha net bir fotoğraf dene.');
      }
    } catch (e: any) {
      Alert.alert('Tarama başarısız', e.response?.data?.detail || 'AI tarama yapılamadı.');
    } finally {
      setScanning(false);
    }
  };

  const handleScanFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kamera izni gerekli', 'Reçete/kutu fotoğrafı için kamera izni vermelisin.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const item = result.assets[0];
      handleScanFromAsset({ uri: item.uri, name: item.fileName || `med-${Date.now()}.jpg`, mimeType: item.mimeType || 'image/jpeg' });
    }
  };

  const handleScanFromGallery = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const item = result.assets[0];
      handleScanFromAsset({ uri: item.uri, name: item.name, mimeType: item.mimeType || 'application/octet-stream' });
    }
  };

  const handleScanFromAsset = (asset: { uri: string; name: string; mimeType: string }) => {
    handleScanFile(asset);
  };

  const applyCandidate = (c: MedicationCandidate) => {
    setForm({
      name: c.name || '',
      dosage: c.dosage || '',
      time_taken: c.suggested_time || '',
      notes: [c.usage, c.notes, c.barcode ? `Barkod: ${c.barcode}` : null].filter(Boolean).join(' | '),
    });
    setReminderEnabled(!!c.suggested_time);
    setScanSummary(scanResult?.summary || null);
    setScanResult(null);
  };

  const setValue = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (kind === 'symptom') {
        await addSymptom({ date: selectedDate, symptom_name: form.symptom_name, severity: Number(form.severity || 5), notes: form.notes || '' });
      }
      if (kind === 'medication') {
        await addMedication({
          date: selectedDate,
          name: form.name,
          dosage: form.dosage || 'Belirtilmedi',
          time_taken: form.time_taken || null,
          notes: form.notes || '',
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? (form.time_taken || null) : null,
          ai_scan_summary: scanSummary || null,
        });
        if (reminderEnabled && form.time_taken) {
          scheduleMedicationReminder({
            medicationName: form.name,
            dosage: form.dosage || '',
            reminderTime: form.time_taken,
          }).catch(() => {});
        }
        setScanSummary(null);
      }
      if (kind === 'sleep') {
        await addSleep({ date: selectedDate, hours_slept: Number(form.hours_slept || 0), quality: form.quality || 'good', notes: form.notes || '' });
      }
      if (kind === 'nutrition') {
        await addNutrition({ date: selectedDate, meal_type: form.meal_type || 'snack', water_ml: Number(form.water_ml || 0), notes: form.notes || 'Mobil beslenme kaydı' });
      }
      setForm({});
      setReminderEnabled(false);
    } catch (error: any) {
      Alert.alert('Kayıt eklenemedi', error.response?.data?.detail || 'Bilgileri kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Günlük Takip</Text>
          <Text style={styles.headerTitle}>Sağlık Kayıtları</Text>
        </View>
      </FadeIn>

      {/* Date selector */}
      <FadeIn delay={80}>
        <GlassCard>
          <Field
            label="Seçili Tarih"
            value={selectedDate}
            onChangeText={(value) => setSelectedDate(value).catch(() => {})}
            icon={<Ionicons name="calendar-outline" color={colors.navy400} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {/* Category selector */}
      <View style={styles.categoryGrid}>
        {(Object.keys(KIND_META) as Kind[]).map((k, idx) => {
          const meta = KIND_META[k];
          const isActive = kind === k;
          const palette = {
            teal: { bg: 'rgba(15,184,165,0.18)', border: 'rgba(15,184,165,0.4)', text: colors.teal300 },
            blue: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.4)', text: colors.blueLight },
            purple: { bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.4)', text: '#c084fc' },
            pink: { bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.4)', text: '#f472b6' },
          }[meta.accent];
          return (
            <FadeIn key={k} delay={120 + idx * 50} style={{ flex: 1, minWidth: '47%' }}>
              <Pressable
                onPress={() => setKind(k)}
                style={({ pressed }) => [
                  styles.categoryCard,
                  isActive && { backgroundColor: palette.bg, borderColor: palette.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name={meta.icon} color={isActive ? palette.text : colors.navy400} size={22} />
                <Text style={[styles.categoryText, isActive && { color: palette.text }]}>{meta.label}</Text>
              </Pressable>
            </FadeIn>
          );
        })}
      </View>

      {/* Form */}
      <FadeIn delay={320}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: 'rgba(15,184,165,0.12)', borderColor: 'rgba(15,184,165,0.3)' }]}>
              <Ionicons name={KIND_META[kind].icon} color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>{KIND_META[kind].label} Ekle</Text>
          </View>

          {kind === 'symptom' && (
            <>
              <Field label="Semptom adı" value={form.symptom_name || ''} onChangeText={(v) => setValue('symptom_name', v)} placeholder="Baş ağrısı, mide bulantısı..." />
              <Field label="Şiddet (1-10)" value={form.severity || ''} onChangeText={(v) => setValue('severity', v)} keyboardType="number-pad" placeholder="5" />
            </>
          )}
          {kind === 'medication' && (
            <>
              {/* AI Tarama bölümü */}
              <View style={styles.scanBox}>
                <View style={styles.scanHeader}>
                  <View style={styles.scanIconBg}>
                    <Ionicons name="scan-outline" color={colors.teal300} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scanTitle}>AI ile reçete/kutu tara</Text>
                    <Text style={styles.scanDesc}>Fotoğraf çek veya yükle, ilaç bilgisi otomatik dolsun.</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="Kamera"
                      variant="secondary"
                      size="sm"
                      onPress={handleScanFromCamera}
                      disabled={scanning}
                      icon={<Ionicons name="camera-outline" color={colors.white} size={16} />}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="Dosya"
                      variant="secondary"
                      size="sm"
                      onPress={handleScanFromGallery}
                      disabled={scanning}
                      icon={<Ionicons name="folder-outline" color={colors.white} size={16} />}
                    />
                  </View>
                </View>

                {scanning && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <ActivityIndicator color={colors.teal300} size="small" />
                    <Text style={styles.scanLoading}>AI taranıyor...</Text>
                  </View>
                )}

                {scanResult && scanResult.medications.length > 0 && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {scanResult.summary && <Muted>{scanResult.summary}</Muted>}
                    {scanResult.medications.map((c, i) => (
                      <Pressable
                        key={`${c.name}-${i}`}
                        onPress={() => applyCandidate(c)}
                        style={({ pressed }) => [styles.candidateCard, pressed && { opacity: 0.85 }]}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.candidateName}>{c.name || 'İlaç adı okunamadı'}</Text>
                          <Text style={styles.candidateDosage}>{c.dosage || 'Doz bilgisi yok'}</Text>
                          {(c.usage || c.notes) && (
                            <Text style={styles.candidateMeta}>{[c.usage, c.notes].filter(Boolean).join(' | ')}</Text>
                          )}
                        </View>
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>%{Math.round((c.confidence || 0) * 100)}</Text>
                        </View>
                      </Pressable>
                    ))}
                    {scanResult.warnings?.length > 0 && (
                      <View style={styles.warningBox}>
                        {scanResult.warnings.map((w, i) => (
                          <Text key={i} style={styles.warningText}>• {w}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Field label="İlaç adı" value={form.name || ''} onChangeText={(v) => setValue('name', v)} placeholder="Örn: Parol" />
              <Field label="Doz" value={form.dosage || ''} onChangeText={(v) => setValue('dosage', v)} placeholder="500mg" />
              <Field label="Saat (HH:MM)" value={form.time_taken || ''} onChangeText={(v) => setValue('time_taken', v)} placeholder="08:00" />
              <ToggleRow
                label="Günlük hatırlatıcı kur"
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                description="Her gün bu saatte bildirim al"
              />
              {scanSummary && (
                <View style={styles.scanSummaryBox}>
                  <Ionicons name="sparkles" color={colors.teal300} size={12} />
                  <Text style={styles.scanSummaryText}>{scanSummary}</Text>
                </View>
              )}
            </>
          )}
          {kind === 'sleep' && (
            <>
              <Field label="Uyku süresi (saat)" value={form.hours_slept || ''} onChangeText={(v) => setValue('hours_slept', v)} keyboardType="decimal-pad" placeholder="7.5" />
              <Field label="Kalite (bad/fair/good/excellent)" value={form.quality || 'good'} onChangeText={(v) => setValue('quality', v)} />
            </>
          )}
          {kind === 'nutrition' && (
            <>
              <Field label="Öğün (breakfast/lunch/dinner/snack)" value={form.meal_type || 'snack'} onChangeText={(v) => setValue('meal_type', v)} />
              <Field label="Su (ml)" value={form.water_ml || ''} onChangeText={(v) => setValue('water_ml', v)} keyboardType="number-pad" placeholder="500" />
            </>
          )}
          <Field label="Not (opsiyonel)" value={form.notes || ''} onChangeText={(v) => setValue('notes', v)} multiline placeholder="Ek bilgi..." />
          <AppButton
            title="Kaydet"
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="checkmark-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {/* Today's records */}
      <FadeIn delay={400}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="albums-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Bugünün Kayıtları</Text>
          </View>

          <RecordList
            title="Semptomlar"
            accent="pink"
            items={dailyData?.symptoms || []}
            render={(item: any) => `${item.symptom_name} • ${item.severity}/10`}
            onDelete={(id) => deleteItem('symptoms', id)}
          />
          <RecordList
            title="İlaçlar"
            accent="teal"
            items={dailyData?.medications || []}
            render={(item: any) => `${item.name} (${item.dosage})${item.is_taken ? ' ✓' : ''}`}
            onDelete={(id) => deleteItem('medications', id)}
            onAction={(id) => markMedicationTaken(id)}
            actionLabel="Alındı"
          />
          <RecordList
            title="Uyku"
            accent="blue"
            items={dailyData?.sleep || []}
            render={(item: any) => `${item.hours_slept} saat • ${qualityLabels[item.quality] || item.quality}`}
            onDelete={(id) => deleteItem('sleep', id)}
          />
          <RecordList
            title="Beslenme"
            accent="purple"
            items={dailyData?.nutrition || []}
            render={(item: any) => `${mealLabels[item.meal_type] || item.meal_type} • ${item.water_ml} ml`}
            onDelete={(id) => deleteItem('nutrition', id)}
          />
        </GlassCard>
      </FadeIn>
    </Screen>
  );
}

function RecordList({
  title,
  accent,
  items,
  render,
  onDelete,
  onAction,
  actionLabel,
}: {
  title: string;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
  items: any[];
  render: (item: any) => string;
  onDelete: (id: number) => Promise<void>;
  onAction?: (id: number) => Promise<void>;
  actionLabel?: string;
}) {
  const accentColor = {
    teal: colors.teal300,
    blue: colors.blueLight,
    purple: '#c084fc',
    pink: '#f472b6',
  }[accent];

  return (
    <View style={{ gap: 6, marginTop: 6 }}>
      <Text style={[styles.listTitle, { color: accentColor }]}>{title}</Text>
      {items.length ? (
        items.map((item: any) => (
          <View key={item.id} style={styles.recordRow}>
            <View style={[styles.recordDot, { backgroundColor: accentColor }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.recordText}>{render(item)}</Text>
              {item.notes ? <Muted>{item.notes}</Muted> : null}
            </View>
            {onAction && !item.is_taken && (
              <Pressable onPress={() => onAction(item.id)} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>{actionLabel}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" color={colors.red} size={16} />
            </Pressable>
          </View>
        ))
      ) : (
        <Muted>Kayıt yok.</Muted>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 4,
    gap: 4,
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
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    color: colors.navy300,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
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
  cardTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  listTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(159,179,200,0.06)',
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recordText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderColor: 'rgba(15,184,165,0.4)',
    borderWidth: 1,
    borderRadius: 8,
  },
  actionBtnText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  deleteBtn: {
    padding: 6,
  },
  scanBox: {
    backgroundColor: 'rgba(15,184,165,0.06)',
    borderColor: 'rgba(15,184,165,0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  scanDesc: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 15,
  },
  scanLoading: {
    color: colors.teal300,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20,40,58,0.65)',
    borderColor: 'rgba(159,179,200,0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  candidateName: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  candidateDosage: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  candidateMeta: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  confidenceText: {
    color: colors.teal300,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  warningBox: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  warningText: {
    color: '#fde68a',
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 16,
  },
  scanSummaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(15,184,165,0.06)',
    borderColor: 'rgba(15,184,165,0.2)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  scanSummaryText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    lineHeight: 15,
  },
});
