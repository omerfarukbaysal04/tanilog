import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AppButton,
  EmptyState,
  FadeIn,
  Field,
  GlassCard,
  LinearGradient,
  Muted,
  Screen,
} from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';
import { colors } from '../../../src/theme';

const CATEGORIES = [
  { key: 'symptom', label: 'Semptom', icon: 'thermometer-outline' as const, color: colors.red },
  { key: 'medication', label: 'İlaç', icon: 'medkit-outline' as const, color: colors.teal300 },
  { key: 'sleep', label: 'Uyku', icon: 'moon-outline' as const, color: '#818cf8' },
  { key: 'nutrition', label: 'Beslenme', icon: 'nutrition-outline' as const, color: '#34d399' },
  { key: 'note', label: 'Not', icon: 'document-text-outline' as const, color: colors.navy300 },
  { key: 'appointment', label: 'Randevu', icon: 'calendar-outline' as const, color: colors.yellow },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

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

  const initials = selectedMember.full_name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  const handleDelete = (entryId: number, entryTitle: string) => {
    Alert.alert('Kaydı Sil', `"${entryTitle}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteEntry(selectedMember.id, entryId).catch(() => {}),
      },
    ]);
  };

  const age = selectedMember.birth_year
    ? new Date().getFullYear() - selectedMember.birth_year
    : null;

  return (
    <Screen withOrbs>
      {/* Üye Başlık Kartı */}
      <FadeIn delay={0}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" color={colors.teal300} size={20} />
          <Text style={styles.backText}>Aile Listesi</Text>
        </Pressable>
      </FadeIn>

      <FadeIn delay={60}>
        <GlassCard accent="teal">
          <View style={styles.memberHeader}>
            <LinearGradient
              colors={['#2dd4bf', '#0fb8a5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.memberName}>{selectedMember.full_name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectedMember.relation}</Text>
                </View>
                {age && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{age} yaş</Text>
                  </View>
                )}
              </View>
              {selectedMember.phone && (
                <Muted>📞 {selectedMember.phone}</Muted>
              )}
              {selectedMember.notes && (
                <Muted>{selectedMember.notes}</Muted>
              )}
            </View>
          </View>
        </GlassCard>
      </FadeIn>

      {/* Kayıt Ekle */}
      <FadeIn delay={120}>
        {showAddForm ? (
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="add-circle-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Yeni Kayıt</Text>
            </View>

            {/* Kategori seçici */}
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[styles.catPill, active && { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}60` }]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Ionicons name={cat.icon} color={active ? cat.color : colors.navy400} size={14} />
                    <Text style={[styles.catText, active && { color: cat.color, fontFamily: 'Poppins_700Bold' }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Başlık *"
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Baş ağrısı, Aspirin 500mg"
            />
            {category === 'symptom' && (
              <Field
                label="Şiddet (1-10)"
                value={severity}
                onChangeText={setSeverity}
                keyboardType="numeric"
                placeholder="5"
              />
            )}
            <Field
              label="Detaylar"
              value={details}
              onChangeText={setDetails}
              multiline
              placeholder="Ek bilgi..."
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="İptal"
                  variant="secondary"
                  onPress={() => { setShowAddForm(false); setTitle(''); setDetails(''); setSeverity(''); }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton title="Kaydet" onPress={handleAdd} loading={isSaving} />
              </View>
            </View>
          </GlassCard>
        ) : (
          <AppButton
            title="+ Kayıt Ekle"
            onPress={() => setShowAddForm(true)}
            icon={<Ionicons name="add-circle-outline" color={colors.white} size={18} />}
          />
        )}
      </FadeIn>

      {/* Kayıtlar listesi */}
      <FadeIn delay={180}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Sağlık Kayıtları ({entries.length})</Text>
          {isLoading && <Muted>Yükleniyor...</Muted>}
        </View>
      </FadeIn>

      {!isLoading && entries.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="heart-outline" color={colors.teal300} size={28} />}
          title="Henüz kayıt yok"
          description="Bu aile üyesi için sağlık kaydı eklemek için yukardaki butonu kullan."
        />
      ) : (
        entries.map((entry, idx) => {
          const cat = CAT_MAP[entry.category];
          return (
            <FadeIn key={entry.id} delay={200 + idx * 40}>
              <GlassCard>
                <View style={styles.entryRow}>
                  <View style={[styles.entryIcon, { backgroundColor: `${cat?.color ?? colors.teal300}18`, borderColor: `${cat?.color ?? colors.teal300}40` }]}>
                    <Ionicons name={cat?.icon ?? 'document-outline'} color={cat?.color ?? colors.teal300} size={16} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <View style={[styles.catBadge, { borderColor: `${cat?.color ?? colors.teal300}50` }]}>
                        <Text style={[styles.catBadgeText, { color: cat?.color ?? colors.teal300 }]}>
                          {cat?.label ?? entry.category}
                        </Text>
                      </View>
                      {entry.severity && (
                        <View style={styles.severityBadge}>
                          <Text style={styles.severityText}>Şiddet {entry.severity}/10</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    {entry.details && <Muted>{entry.details}</Muted>}
                    <Muted>{new Date(entry.entry_date).toLocaleDateString('tr-TR')}</Muted>
                  </View>
                  {typeof entry.id === 'number' && (
                    <Pressable
                      onPress={() => handleDelete(entry.id as number, entry.title)}
                      style={styles.deleteBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" color={colors.redLight} size={16} />
                    </Pressable>
                  )}
                </View>
              </GlassCard>
            </FadeIn>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
    paddingTop: 12,
  },
  backText: {
    color: colors.teal300,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  memberHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
  },
  memberName: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
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
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.12)',
    borderWidth: 1,
  },
  catText: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  sectionLabel: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  entryTitle: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  catBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  catBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  severityBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    color: colors.redLight,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
