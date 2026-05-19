import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, Field, GlassCard, Muted, Screen, ToggleRow } from '../../src/components/ui';
import useHealthStore from '../../src/stores/healthStore';
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
  } = useHealthStore();

  const [kind, setKind] = useState<Kind>('symptom');
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDailySummary().catch((error) => Alert.alert('Sağlık verisi alınamadı', error.message));
    }, [fetchDailySummary]),
  );

  const setValue = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (kind === 'symptom') {
        await addSymptom({ date: selectedDate, symptom_name: form.symptom_name, severity: Number(form.severity || 5), notes: form.notes || '' });
      }
      if (kind === 'medication') {
        await addMedication({ date: selectedDate, name: form.name, dosage: form.dosage || 'Belirtilmedi', time_taken: form.time_taken || null, notes: form.notes || '' });
        if (reminderEnabled && form.time_taken) {
          scheduleMedicationReminder({
            medicationName: form.name,
            dosage: form.dosage || '',
            reminderTime: form.time_taken,
          }).catch(() => {});
        }
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
    <Screen withOrbs>
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
              <Field label="İlaç adı" value={form.name || ''} onChangeText={(v) => setValue('name', v)} placeholder="Örn: Parol" />
              <Field label="Doz" value={form.dosage || ''} onChangeText={(v) => setValue('dosage', v)} placeholder="500mg" />
              <Field label="Saat (HH:MM)" value={form.time_taken || ''} onChangeText={(v) => setValue('time_taken', v)} placeholder="08:00" />
              <ToggleRow
                label="Günlük hatırlatıcı kur"
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                description="Her gün bu saatte bildirim al"
              />
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
});
