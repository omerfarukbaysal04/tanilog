import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../src/components/ui';
import useHealthStore from '../../src/stores/healthStore';
import { colors } from '../../src/theme';

type Kind = 'symptom' | 'medication' | 'sleep' | 'nutrition';

const qualityLabels = { bad: 'Kötü', fair: 'Orta', good: 'İyi', excellent: 'Mükemmel' };
const mealLabels = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Atıştırmalık' };

export default function HealthScreen() {
  const { selectedDate, dailyData, fetchDailySummary, setSelectedDate, addSymptom, addMedication, addSleep, addNutrition, deleteItem, markMedicationTaken } = useHealthStore();
  const [kind, setKind] = useState<Kind>('symptom');
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
      }
      if (kind === 'sleep') {
        await addSleep({ date: selectedDate, hours_slept: Number(form.hours_slept || 0), quality: form.quality || 'good', notes: form.notes || '' });
      }
      if (kind === 'nutrition') {
        await addNutrition({ date: selectedDate, meal_type: form.meal_type || 'snack', water_ml: Number(form.water_ml || 0), notes: form.notes || 'Mobil beslenme kaydı' });
      }
      setForm({});
    } catch (error: any) {
      Alert.alert('Kayıt eklenemedi', error.response?.data?.detail || 'Bilgileri kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Title>Sağlık Takibi</Title>
      <Card>
        <Field label="Tarih" value={selectedDate} onChangeText={(value) => setSelectedDate(value).catch(() => {})} />
        <View style={styles.segment}>
          {(['symptom', 'medication', 'sleep', 'nutrition'] as Kind[]).map((item) => (
            <Pressable key={item} onPress={() => setKind(item)} style={[styles.segmentItem, kind === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, kind === item && styles.segmentTextActive]}>{labelFor(item)}</Text>
            </Pressable>
          ))}
        </View>
        {kind === 'symptom' && (
          <>
            <Field label="Semptom" value={form.symptom_name || ''} onChangeText={(v) => setValue('symptom_name', v)} />
            <Field label="Şiddet (1-10)" value={form.severity || ''} onChangeText={(v) => setValue('severity', v)} keyboardType="number-pad" />
          </>
        )}
        {kind === 'medication' && (
          <>
            <Field label="İlaç adı" value={form.name || ''} onChangeText={(v) => setValue('name', v)} />
            <Field label="Doz" value={form.dosage || ''} onChangeText={(v) => setValue('dosage', v)} />
            <Field label="Saat (HH:MM)" value={form.time_taken || ''} onChangeText={(v) => setValue('time_taken', v)} />
          </>
        )}
        {kind === 'sleep' && (
          <>
            <Field label="Uyku süresi" value={form.hours_slept || ''} onChangeText={(v) => setValue('hours_slept', v)} keyboardType="decimal-pad" />
            <Field label="Kalite (bad/fair/good/excellent)" value={form.quality || 'good'} onChangeText={(v) => setValue('quality', v)} />
          </>
        )}
        {kind === 'nutrition' && (
          <>
            <Field label="Öğün (breakfast/lunch/dinner/snack)" value={form.meal_type || 'snack'} onChangeText={(v) => setValue('meal_type', v)} />
            <Field label="Su (ml)" value={form.water_ml || ''} onChangeText={(v) => setValue('water_ml', v)} keyboardType="number-pad" />
          </>
        )}
        <Field label="Not" value={form.notes || ''} onChangeText={(v) => setValue('notes', v)} multiline />
        <AppButton title="Kaydet" onPress={handleSave} loading={saving} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Bugünün kayıtları</Text>
        <List title="Semptomlar" items={dailyData?.symptoms || []} render={(item: any) => `${item.symptom_name} - ${item.severity}/10`} onDelete={(id) => deleteItem('symptoms', id)} />
        <List title="İlaçlar" items={dailyData?.medications || []} render={(item: any) => `${item.name} (${item.dosage}) ${item.is_taken ? '- alındı' : ''}`} onDelete={(id) => deleteItem('medications', id)} onAction={(id) => markMedicationTaken(id)} actionLabel="Alındı" />
        <List title="Uyku" items={dailyData?.sleep || []} render={(item: any) => `${item.hours_slept} saat - ${qualityLabels[item.quality as keyof typeof qualityLabels] || item.quality}`} onDelete={(id) => deleteItem('sleep', id)} />
        <List title="Beslenme" items={dailyData?.nutrition || []} render={(item: any) => `${mealLabels[item.meal_type as keyof typeof mealLabels] || item.meal_type} - ${item.water_ml} ml`} onDelete={(id) => deleteItem('nutrition', id)} />
      </Card>
    </Screen>
  );
}

function labelFor(kind: Kind) {
  return { symptom: 'Semptom', medication: 'İlaç', sleep: 'Uyku', nutrition: 'Beslenme' }[kind];
}

function List({
  title,
  items,
  render,
  onDelete,
  onAction,
  actionLabel,
}: {
  title: string;
  items: any[];
  render: (item: any) => string;
  onDelete: (id: number) => Promise<void>;
  onAction?: (id: number) => Promise<void>;
  actionLabel?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.listTitle}>{title}</Text>
      {items.length ? items.map((item: any) => (
        <View key={item.id} style={styles.listRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemText}>{render(item)}</Text>
            {item.notes ? <Muted>{item.notes}</Muted> : null}
          </View>
          {onAction ? <Pressable onPress={() => onAction(item.id)}><Text style={styles.action}>{actionLabel}</Text></Pressable> : null}
          <Pressable onPress={() => onDelete(item.id)}><Text style={styles.delete}>Sil</Text></Pressable>
        </View>
      )) : <Muted>Kayıt yok.</Muted>}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentItem: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.navy900, borderWidth: 1, borderColor: colors.navy700 },
  segmentActive: { backgroundColor: colors.teal500, borderColor: colors.teal500 },
  segmentText: { color: colors.navy300, fontSize: 12, fontWeight: '800' },
  segmentTextActive: { color: colors.white },
  sectionTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  listTitle: { color: colors.teal300, fontWeight: '900', marginTop: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.navy700, paddingTop: 8 },
  itemText: { color: colors.white, fontWeight: '700' },
  action: { color: colors.teal300, fontWeight: '900' },
  delete: { color: colors.red, fontWeight: '900' },
});
