import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, Card, Field, Muted, Screen } from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';
import { colors } from '../../../src/theme';

const CATEGORIES = ['symptom', 'medication', 'sleep', 'nutrition', 'note', 'appointment'];
const CATEGORY_LABELS: Record<string, string> = {
  symptom: 'Semptom',
  medication: 'İlaç',
  sleep: 'Uyku',
  nutrition: 'Beslenme',
  note: 'Not',
  appointment: 'Randevu',
};

export default function MemberScreen() {
  const { selectedMember, entries, isLoading, isSaving, fetchEntries, addEntry, deleteEntry } = useFamilyStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState('symptom');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (selectedMember) {
        fetchEntries(selectedMember.id).catch(() => {});
      }
    }, [fetchEntries, selectedMember?.id]),
  );

  if (!selectedMember) return null;

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Başlık zorunludur.');
      return;
    }
    try {
      await addEntry(selectedMember.id, {
        entry_date: new Date().toISOString().split('T')[0],
        category,
        title: title.trim(),
        severity: severity ? parseInt(severity, 10) : undefined,
        details: details.trim() || undefined,
      });
      setTitle('');
      setDetails('');
      setSeverity('');
      setShowAddForm(false);
    } catch (e: any) {
      Alert.alert('Eklenemedi', e.response?.data?.detail || e.message);
    }
  };

  return (
    <Screen>
      {/* Üye Bilgisi */}
      <Card>
        <View style={styles.memberHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {selectedMember.full_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name}>{selectedMember.full_name}</Text>
            <Muted>{selectedMember.relation}{selectedMember.birth_year ? ` · ${new Date().getFullYear() - selectedMember.birth_year} yaş` : ''}</Muted>
            {selectedMember.phone && <Muted>📞 {selectedMember.phone}</Muted>}
            {selectedMember.notes && <Muted>{selectedMember.notes}</Muted>}
          </View>
        </View>
      </Card>

      {/* Kayıt Ekle */}
      {showAddForm ? (
        <Card>
          <Text style={styles.sectionTitle}>Yeni Kayıt</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Field label="Başlık *" value={title} onChangeText={setTitle} placeholder="Örn: Baş ağrısı, Aspirin 500mg" />
          {(category === 'symptom') && (
            <Field label="Şiddet (1-10)" value={severity} onChangeText={setSeverity} keyboardType="numeric" placeholder="5" />
          )}
          <Field label="Detaylar" value={details} onChangeText={setDetails} multiline placeholder="Ek bilgi..." />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppButton title="İptal" variant="secondary" onPress={() => setShowAddForm(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Kaydet" onPress={handleAdd} loading={isSaving} />
            </View>
          </View>
        </Card>
      ) : (
        <AppButton title="+ Kayıt Ekle" onPress={() => setShowAddForm(true)} />
      )}

      {/* Kayıtlar */}
      <Text style={styles.sectionTitle}>Sağlık Kayıtları</Text>
      {isLoading && entries.length === 0 ? (
        <Muted>Yükleniyor...</Muted>
      ) : entries.length === 0 ? (
        <Muted>Henüz kayıt yok.</Muted>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.entryHeader}>
                <Text style={styles.categoryBadge}>{CATEGORY_LABELS[entry.category] ?? entry.category}</Text>
                {entry.severity && <Text style={styles.severity}>Şiddet: {entry.severity}/10</Text>}
              </View>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              {entry.details && <Muted>{entry.details}</Muted>}
              <Muted>{new Date(entry.entry_date).toLocaleDateString('tr-TR')}</Muted>
            </View>
            <Pressable onPress={() =>
              Alert.alert('Kaydı Sil', entry.title, [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => deleteEntry(selectedMember.id, entry.id).catch(() => {}) },
              ])
            }>
              <Ionicons name="trash-outline" color={colors.red} size={18} />
            </Pressable>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  memberHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 18,
  },
  name: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy800,
  },
  catPillActive: {
    backgroundColor: colors.teal500,
    borderColor: colors.teal500,
  },
  catText: {
    color: colors.navy400,
    fontSize: 12,
    fontWeight: '600',
  },
  catTextActive: {
    color: colors.white,
  },
  entryCard: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    color: colors.teal300,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.navy800,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severity: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: '700',
  },
  entryTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
