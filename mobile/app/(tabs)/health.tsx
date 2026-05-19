import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AppButton, FadeIn, Field, GlassCard, Muted, Screen, ToggleRow } from '../../src/components/ui';
import useHealthStore, { MedicationCandidate, MedicationScanResult } from '../../src/stores/healthStore';
import { scheduleMedicationReminder, scheduleMedicationReminderMultiple } from '../../src/lib/notifications';
import api from '../../src/lib/api';
import { colors } from '../../src/theme';

type Kind = 'symptom' | 'medication' | 'sleep' | 'nutrition';

const FREQUENCIES = [
  { key: 'once', label: 'Günde 1', count: 1 },
  { key: 'twice', label: 'Günde 2', count: 2 },
  { key: 'three', label: 'Günde 3', count: 3 },
  { key: 'four', label: 'Günde 4', count: 4 },
  { key: 'as_needed', label: 'İhtiyaç halinde', count: 0 },
];

function frequencyCount(freq: string): number {
  return FREQUENCIES.find((f) => f.key === freq)?.count ?? 1;
}

function frequencyLabel(freq: string): string {
  return FREQUENCIES.find((f) => f.key === freq)?.label ?? '';
}

// 1734 → 17:34 / 17.34 → 17:34 / 17-34 → 17:34 / 17:34 → 17:34
function formatTimeInput(raw: string): string {
  if (!raw) return '';
  let clean = raw.replace(/[^\d]/g, '');
  if (clean.length === 0) return '';
  if (clean.length > 4) clean = clean.slice(0, 4);
  if (clean.length <= 2) return clean;
  const h = clean.slice(0, 2);
  const m = clean.slice(2);
  return `${h}:${m}`;
}

function currentHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const KIND_META: Record<Kind, { label: string; icon: keyof typeof Ionicons.glyphMap; accent: 'pink' | 'teal' | 'blue' | 'purple' }> = {
  symptom: { label: 'Semptom', icon: 'pulse-outline', accent: 'pink' },
  medication: { label: 'İlaç', icon: 'medkit-outline', accent: 'teal' },
  sleep: { label: 'Uyku', icon: 'moon-outline', accent: 'blue' },
  nutrition: { label: 'Beslenme', icon: 'restaurant-outline', accent: 'purple' },
};

const qualityLabels: Record<string, string> = { bad: 'Kötü', fair: 'Orta', good: 'İyi', excellent: 'Mükemmel' };
const mealLabels: Record<string, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam Yemeği', snack: 'Atıştırmalık' };

const QUALITY_OPTIONS = ['bad', 'fair', 'good', 'excellent'];
const MEAL_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack'];

function normalizeDosage(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // If it's purely numeric (e.g. "100"), append " mg"
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed} mg`;
  return trimmed;
}

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
  // Detail modal
  const [detailItem, setDetailItem] = useState<{ kind: Kind; item: any } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  // Interaction check
  const [interactionResult, setInteractionResult] = useState<string | null>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

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
      if (result.error) {
        Alert.alert('AI tarama tamamlanamadı', result.error);
      } else if (!result.medications?.length) {
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
    // Validation
    if (kind === 'symptom' && !form.symptom_name?.trim()) {
      Alert.alert('Eksik bilgi', 'Semptom adı boş olamaz.'); return;
    }
    if (kind === 'medication' && !form.name?.trim()) {
      Alert.alert('Eksik bilgi', 'İlaç adı boş olamaz.'); return;
    }
    if (kind === 'medication' && !form.dosage?.trim()) {
      Alert.alert('Eksik bilgi', 'Doz bilgisi boş olamaz. Örn: 500mg veya 500'); return;
    }
    if (kind === 'sleep' && !form.hours_slept) {
      Alert.alert('Eksik bilgi', 'Uyku süresi girilmedi.'); return;
    }

    setSaving(true);
    try {
      if (kind === 'symptom') {
        await addSymptom({ date: selectedDate, symptom_name: form.symptom_name, severity: Number(form.severity || 5), notes: form.notes || '' });
      }
      if (kind === 'medication') {
        const freq = form.frequency || 'once';
        const freqLbl = frequencyLabel(freq);
        const normalizedDosage = normalizeDosage(form.dosage || '');
        // dosage'ı sıklıkla zenginleştir: "500 mg • Günde 3"
        const dosagePayload = normalizedDosage
          ? freq && freq !== 'as_needed'
            ? `${normalizedDosage} • ${freqLbl}`
            : normalizedDosage
          : 'Belirtilmedi';

        await addMedication({
          date: selectedDate,
          name: form.name,
          dosage: dosagePayload,
          time_taken: form.time_taken || null,
          notes: form.notes || '',
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? (form.time_taken || null) : null,
          ai_scan_summary: scanSummary || null,
        });

        // Hatırlatıcı: ihtiyaç halinde değilse ve en az bir saat varsa
        if (reminderEnabled && form.time_taken && freq !== 'as_needed') {
          const count = frequencyCount(freq);
          // Collect all entered times
          const allTimes = [form.time_taken, form.time_2, form.time_3, form.time_4]
            .filter(Boolean)
            .slice(0, count) as string[];
          for (const t of allTimes) {
            await scheduleMedicationReminder({
              medicationName: form.name,
              dosage: normalizedDosage,
              reminderTime: t,
            }).catch(() => {});
          }
        }
        setScanSummary(null);
      }
      if (kind === 'sleep') {
        await addSleep({ date: selectedDate, hours_slept: Number(form.hours_slept || 0), quality: form.quality || 'good', notes: form.notes || '' });
      }
      if (kind === 'nutrition') {
        await addNutrition({ date: selectedDate, meal_type: form.meal_type || 'snack', water_ml: Number(form.water_ml || 0), notes: form.food_items || form.notes || 'Beslenme kaydı' });
      }
      setForm({});
      setReminderEnabled(false);
    } catch (error: any) {
      Alert.alert('Kayıt eklenemedi', error.response?.data?.detail || 'Bilgileri kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  const checkInteractions = async () => {
    if (!dailyData?.medications?.length) {
      Alert.alert('İlaç yok', 'Etkileşim kontrolü için önce ilaç kaydı ekleyin.');
      return;
    }
    setCheckingInteractions(true);
    setInteractionResult(null);
    try {
      const { data } = await api.post('/ai/medication-interactions', { days: 7 });
      if (data.error) {
        Alert.alert('AI kontrol tamamlanamadı', data.error);
        return;
      }
      const summary = data.summary || data.interactions_summary || 'Analiz tamamlandı.';
      const warnings = data.warnings || data.critical_findings || '';
      setInteractionResult(warnings ? `${summary}\n\n⚠️ ${warnings}` : summary);
    } catch (e: any) {
      Alert.alert('Etkileşim kontrol hatası', e.response?.data?.detail || e.message);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!detailItem) return;
    setEditSaving(true);
    try {
      const { kind: k, item } = detailItem;
      const kindPath = k === 'symptom' ? 'symptoms' : k === 'medication' ? 'medications' : k === 'sleep' ? 'sleep' : 'nutrition';
      let payload: Record<string, any> = {};
      if (k === 'symptom') {
        payload = { symptom_name: editForm.symptom_name, severity: Number(editForm.severity || 5), notes: editForm.notes || '' };
      } else if (k === 'medication') {
        payload = { name: editForm.name, dosage: normalizeDosage(editForm.dosage || ''), time_taken: editForm.time_taken || null, notes: editForm.notes || '' };
      } else if (k === 'sleep') {
        payload = { hours_slept: Number(editForm.hours_slept || 0), quality: editForm.quality || 'good', notes: editForm.notes || '' };
      } else if (k === 'nutrition') {
        payload = { meal_type: editForm.meal_type || 'snack', water_ml: Number(editForm.water_ml || 0), notes: editForm.food_items || editForm.notes || '' };
      }
      await api.patch(`/health/${kindPath}/${item.id}`, payload);
      await fetchDailySummary();
      setDetailItem(null);
      Alert.alert('Güncellendi', 'Kayıt başarıyla güncellendi.');
    } catch (e: any) {
      Alert.alert('Güncelleme başarısız', e.response?.data?.detail || e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const openDetail = (itemKind: Kind, item: any) => {
    setDetailItem({ kind: itemKind, item });
    // Pre-fill edit form
    if (itemKind === 'symptom') {
      setEditForm({ symptom_name: item.symptom_name || '', severity: String(item.severity || 5), notes: item.notes || '' });
    } else if (itemKind === 'medication') {
      setEditForm({ name: item.name || '', dosage: item.dosage || '', time_taken: item.time_taken || '', notes: item.notes || '' });
    } else if (itemKind === 'sleep') {
      setEditForm({ hours_slept: String(item.hours_slept || ''), quality: item.quality || 'good', notes: item.notes || '' });
    } else if (itemKind === 'nutrition') {
      setEditForm({ meal_type: item.meal_type || 'snack', water_ml: String(item.water_ml || ''), notes: item.notes || '' });
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

              {/* Etkileşim Kontrolü */}
              {dailyData?.medications && dailyData.medications.length > 0 && (
                <View style={styles.interactionBox}>
                  <View style={styles.interactionHeader}>
                    <Ionicons name="warning-outline" color={colors.yellow} size={14} />
                    <Text style={styles.interactionTitle}>İlaç Etkileşim Kontrolü</Text>
                  </View>
                  <AppButton
                    title={checkingInteractions ? 'Kontrol ediliyor...' : 'Son 7 günü kontrol et'}
                    variant="secondary"
                    size="sm"
                    loading={checkingInteractions}
                    onPress={checkInteractions}
                    icon={<Ionicons name="shield-checkmark-outline" color={colors.yellow} size={14} />}
                  />
                  {interactionResult && (
                    <View style={styles.interactionResult}>
                      <Text style={styles.interactionResultText}>{interactionResult}</Text>
                    </View>
                  )}
                </View>
              )}

              <Field label="İlaç adı" value={form.name || ''} onChangeText={(v) => setValue('name', v)} placeholder="Örn: Parol" />
              <Field label="Doz *" value={form.dosage || ''} onChangeText={(v) => setValue('dosage', v)} placeholder="500mg veya 500" />

              {/* Sıklık seçici */}
              <View style={{ gap: 6 }}>
                <Text style={styles.miniLabel}>Sıklık</Text>
                <View style={styles.freqRow}>
                  {FREQUENCIES.map((f) => {
                    const isActive = form.frequency === f.key;
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => setValue('frequency', f.key)}
                        style={({ pressed }) => [
                          styles.freqPill,
                          isActive && styles.freqPillActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={[styles.freqText, isActive && styles.freqTextActive]}>{f.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Doz saatleri - frekansa göre dinamik */}
              {(() => {
                const count = frequencyCount(form.frequency || 'once');
                const timeKeys = ['time_taken', 'time_2', 'time_3', 'time_4'];
                const doseLabels = ['1. Doz saati', '2. Doz saati', '3. Doz saati', '4. Doz saati'];
                const slots = count > 0 ? timeKeys.slice(0, count) : timeKeys.slice(0, 1);
                return (
                  <View style={{ gap: 8 }}>
                    {slots.map((key, i) => (
                      <View key={key} style={{ gap: 4 }}>
                        <Text style={styles.miniLabel}>{doseLabels[i]}</Text>
                        <View style={styles.timeInputRow}>
                          <View style={{ flex: 1 }}>
                            <Field
                              value={form[key] || ''}
                              onChangeText={(v) => setValue(key, formatTimeInput(v))}
                              keyboardType="numbers-and-punctuation"
                              placeholder="08:00"
                              icon={<Ionicons name="time-outline" color={colors.navy400} size={18} />}
                            />
                          </View>
                          <Pressable onPress={() => setValue(key, currentHHMM())} style={styles.nowBtn}>
                            <Ionicons name="flash" color={colors.teal300} size={14} />
                            <Text style={styles.nowBtnText}>Şimdi</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    <Muted>17.34 veya 1734 yazsan da otomatik 17:34'e dönüşür.</Muted>
                  </View>
                );
              })()}

              <ToggleRow
                label="Hatırlatıcı kur"
                value={reminderEnabled}
                onValueChange={(v) => {
                  if (v && !form.time_taken) {
                    Alert.alert('Saat gerekli', 'Hatırlatıcı için doz saatlerini doldurun.');
                    setValue('time_taken', currentHHMM());
                  }
                  setReminderEnabled(v);
                }}
                description={
                  reminderEnabled && !form.time_taken
                    ? '⚠️ Saat girilmeden hatırlatıcı kurulamaz'
                    : form.frequency && form.frequency !== 'as_needed'
                    ? `Her doz saatinde ayrı alarm kurulur (${frequencyCount(form.frequency)} adet)`
                    : 'İlk doz saatinde bildirim gelir'
                }
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
              <View style={{ gap: 6 }}>
                <Text style={styles.miniLabel}>Kalite</Text>
                <View style={styles.freqRow}>
                  {QUALITY_OPTIONS.map((q) => {
                    const isActive = (form.quality || 'good') === q;
                    return (
                      <Pressable
                        key={q}
                        onPress={() => setValue('quality', q)}
                        style={({ pressed }) => [styles.freqPill, isActive && styles.freqPillActive, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={[styles.freqText, isActive && styles.freqTextActive]}>{qualityLabels[q]}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}
          {kind === 'nutrition' && (
            <>
              <View style={{ gap: 6 }}>
                <Text style={styles.miniLabel}>Öğün</Text>
                <View style={styles.freqRow}>
                  {MEAL_OPTIONS.map((m) => {
                    const isActive = (form.meal_type || 'snack') === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setValue('meal_type', m)}
                        style={({ pressed }) => [styles.freqPill, isActive && styles.freqPillActive, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={[styles.freqText, isActive && styles.freqTextActive]}>{mealLabels[m]}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Field label="Yediklerin" value={form.food_items || ''} onChangeText={(v) => setValue('food_items', v)} multiline placeholder="Pilav, tavuk, salata..." />
              <Field label="Su (ml)" value={form.water_ml || ''} onChangeText={(v) => setValue('water_ml', v)} keyboardType="number-pad" placeholder="500" />
            </>
          )}
          {kind !== 'nutrition' && (
            <Field label="Not (opsiyonel)" value={form.notes || ''} onChangeText={(v) => setValue('notes', v)} multiline placeholder="Ek bilgi..." />
          )}
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
            onTap={(item) => openDetail('symptom', item)}
          />
          <RecordList
            title="İlaçlar"
            accent="teal"
            items={dailyData?.medications || []}
            render={(item: any) => `${item.name} (${item.dosage})${item.is_taken ? ' ✓' : ''}`}
            onDelete={(id) => deleteItem('medications', id)}
            onAction={(id) => markMedicationTaken(id)}
            actionLabel="Alındı"
            onTap={(item) => openDetail('medication', item)}
          />
          <RecordList
            title="Uyku"
            accent="blue"
            items={dailyData?.sleep || []}
            render={(item: any) => `${item.hours_slept} saat • ${qualityLabels[item.quality] || item.quality}`}
            onDelete={(id) => deleteItem('sleep', id)}
            onTap={(item) => openDetail('sleep', item)}
          />
          <RecordList
            title="Beslenme"
            accent="purple"
            items={dailyData?.nutrition || []}
            render={(item: any) => `${mealLabels[item.meal_type] || item.meal_type} • ${item.water_ml} ml`}
            onDelete={(id) => deleteItem('nutrition', id)}
            onTap={(item) => openDetail('nutrition', item)}
          />
        </GlassCard>
      </FadeIn>

      {/* Detail / Edit Modal */}
      <Modal
        visible={!!detailItem}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {detailItem ? KIND_META[detailItem.kind].label + ' Detayı' : ''}
              </Text>
              <Pressable onPress={() => setDetailItem(null)} hitSlop={10}>
                <Ionicons name="close" color={colors.navy400} size={22} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {detailItem?.kind === 'symptom' && (
                <View style={{ gap: 10, paddingBottom: 16 }}>
                  <Field label="Semptom adı" value={editForm.symptom_name || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, symptom_name: v }))} />
                  <Field label="Şiddet (1-10)" value={editForm.severity || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, severity: v }))} keyboardType="number-pad" />
                  <Field label="Not" value={editForm.notes || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, notes: v }))} multiline />
                </View>
              )}
              {detailItem?.kind === 'medication' && (
                <View style={{ gap: 10, paddingBottom: 16 }}>
                  {detailItem.item.is_taken && (
                    <View style={[styles.takenBadge]}>
                      <Ionicons name="checkmark-circle" color={colors.teal300} size={14} />
                      <Text style={styles.takenText}>Alındı olarak işaretlendi</Text>
                    </View>
                  )}
                  <Field label="İlaç adı" value={editForm.name || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))} />
                  <Field label="Doz" value={editForm.dosage || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, dosage: v }))} placeholder="500mg" />
                  <Field label="Saat" value={editForm.time_taken || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, time_taken: formatTimeInput(v) }))} keyboardType="numbers-and-punctuation" placeholder="08:00" />
                  <Field label="Not" value={editForm.notes || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, notes: v }))} multiline />
                </View>
              )}
              {detailItem?.kind === 'sleep' && (
                <View style={{ gap: 10, paddingBottom: 16 }}>
                  <Field label="Süre (saat)" value={editForm.hours_slept || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, hours_slept: v }))} keyboardType="decimal-pad" />
                  <View style={{ gap: 6 }}>
                    <Text style={styles.miniLabel}>Kalite</Text>
                    <View style={styles.freqRow}>
                      {QUALITY_OPTIONS.map((q) => {
                        const isActive = (editForm.quality || 'good') === q;
                        return (
                          <Pressable key={q} onPress={() => setEditForm((p) => ({ ...p, quality: q }))} style={[styles.freqPill, isActive && styles.freqPillActive]}>
                            <Text style={[styles.freqText, isActive && styles.freqTextActive]}>{qualityLabels[q]}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <Field label="Not" value={editForm.notes || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, notes: v }))} multiline />
                </View>
              )}
              {detailItem?.kind === 'nutrition' && (
                <View style={{ gap: 10, paddingBottom: 16 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={styles.miniLabel}>Öğün</Text>
                    <View style={styles.freqRow}>
                      {MEAL_OPTIONS.map((m) => {
                        const isActive = (editForm.meal_type || 'snack') === m;
                        return (
                          <Pressable key={m} onPress={() => setEditForm((p) => ({ ...p, meal_type: m }))} style={[styles.freqPill, isActive && styles.freqPillActive]}>
                            <Text style={[styles.freqText, isActive && styles.freqTextActive]}>{mealLabels[m]}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <Field label="Yediklerin" value={editForm.food_items || editForm.notes || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, food_items: v, notes: v }))} multiline placeholder="Pilav, tavuk..." />
                  <Field label="Su (ml)" value={editForm.water_ml || ''} onChangeText={(v) => setEditForm((p) => ({ ...p, water_ml: v }))} keyboardType="number-pad" />
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Pressable
                onPress={() => {
                  if (!detailItem) return;
                  const kindKey = detailItem.kind === 'symptom' ? 'symptoms'
                    : detailItem.kind === 'medication' ? 'medications'
                    : detailItem.kind === 'sleep' ? 'sleep'
                    : 'nutrition';
                  Alert.alert('Kaydı Sil', 'Bu kayıt silinsin mi?', [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Sil', style: 'destructive',
                      onPress: async () => {
                        try { await deleteItem(kindKey as any, detailItem.item.id); setDetailItem(null); }
                        catch (e: any) { Alert.alert('Hata', e.message); }
                      },
                    },
                  ]);
                }}
                style={styles.deleteModalBtn}
              >
                <Ionicons name="trash-outline" color={colors.red} size={18} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <AppButton title="Güncelle" onPress={handleSaveEdit} loading={editSaving} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton title="Kapat" variant="secondary" onPress={() => setDetailItem(null)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  onTap,
}: {
  title: string;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
  items: any[];
  render: (item: any) => string;
  onDelete: (id: number) => Promise<void>;
  onAction?: (id: number) => Promise<void>;
  actionLabel?: string;
  onTap?: (item: any) => void;
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
          <Pressable
            key={item.id}
            onPress={() => onTap?.(item)}
            style={({ pressed }) => [styles.recordRow, pressed && { opacity: 0.8 }]}
          >
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
            <Pressable onPress={() => onDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
              <Ionicons name="trash-outline" color={colors.red} size={16} />
            </Pressable>
          </Pressable>
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
  miniLabel: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  freqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  freqPill: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.15)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  freqPillActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.45)',
  },
  freqText: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  freqTextActive: {
    color: colors.teal300,
    fontFamily: 'Poppins_700Bold',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  nowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 12,
  },
  nowBtnText: {
    color: colors.teal300,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  // Interaction check
  interactionBox: {
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderColor: 'rgba(251,191,36,0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionTitle: {
    color: colors.yellow,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  interactionResult: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 10,
    padding: 10,
  },
  interactionResultText: {
    color: colors.navy200,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,18,32,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0d2035',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: 'rgba(15,184,165,0.18)',
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(159,179,200,0.3)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(159,179,200,0.06)',
  },
  detailLabel: {
    color: colors.navy400,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    width: 52,
  },
  detailVal: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,184,165,0.1)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  takenText: {
    color: colors.teal300,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  deleteModalBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
