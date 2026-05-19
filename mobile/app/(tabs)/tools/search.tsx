import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, Field, GlassCard, Muted, Screen } from '../../../src/components/ui';
import useSearchStore from '../../../src/stores/searchStore';
import { colors } from '../../../src/theme';

const CATEGORIES: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Tümü', value: '', icon: 'apps-outline' },
  { label: 'Semptom', value: 'symptom', icon: 'pulse-outline' },
  { label: 'İlaç', value: 'medication', icon: 'medkit-outline' },
  { label: 'Uyku', value: 'sleep', icon: 'moon-outline' },
  { label: 'Beslenme', value: 'nutrition', icon: 'restaurant-outline' },
  { label: 'Belge', value: 'document', icon: 'document-text-outline' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const { results, isLoading, search, clear } = useSearchStore();

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      await search({ q: query.trim(), category: category || undefined });
    } catch (e: any) {
      Alert.alert('Arama başarısız', e.message);
    }
  };

  const handleClear = () => {
    setQuery('');
    setCategory('');
    clear();
  };

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Keşfet</Text>
          <Text style={styles.headerTitle}>Gelişmiş Arama</Text>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <GlassCard>
          <Field
            label="Arama"
            value={query}
            onChangeText={setQuery}
            placeholder="Semptom, ilaç, belge ara..."
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            icon={<Ionicons name="search-outline" color={colors.navy400} size={18} />}
          />

          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Ionicons name={cat.icon} color={active ? colors.teal300 : colors.navy400} size={13} />
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 3 }}>
              <AppButton
                title="Ara"
                onPress={handleSearch}
                loading={isLoading}
                disabled={!query.trim()}
                icon={<Ionicons name="search" color={colors.white} size={16} />}
              />
            </View>
            {results.length > 0 && (
              <View style={{ flex: 1 }}>
                <AppButton title="Sıfırla" variant="secondary" onPress={handleClear} />
              </View>
            )}
          </View>
        </GlassCard>
      </FadeIn>

      {results.length > 0 && (
        <FadeIn delay={120}>
          <View style={{ gap: 8 }}>
            <Text style={styles.resultCount}>{results.length} sonuç bulundu</Text>
            {results.map((item, idx) => (
              <FadeIn key={idx} delay={140 + idx * 30}>
                <GlassCard accent={item.is_risky ? 'yellow' : undefined}>
                  <View style={styles.resultHeader}>
                    <View style={styles.kindBadge}>
                      <Text style={styles.kindLabel}>{item.kind}</Text>
                    </View>
                    {item.is_risky && (
                      <View style={styles.riskyBadge}>
                        <Ionicons name="warning" color={colors.yellow} size={12} />
                        <Text style={styles.riskyText}>Dikkat</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  {item.description ? <Muted>{item.description}</Muted> : null}
                </GlassCard>
              </FadeIn>
            ))}
          </View>
        </FadeIn>
      )}

      {!isLoading && results.length === 0 && query.length > 0 && (
        <FadeIn delay={100}>
          <GlassCard>
            <View style={{ alignItems: 'center', padding: 20, gap: 8 }}>
              <Ionicons name="search-outline" color={colors.navy400} size={32} />
              <Muted>Sonuç bulunamadı.</Muted>
            </View>
          </GlassCard>
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 4, gap: 4 },
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
  label: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
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
  pillActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  pillText: { color: colors.navy300, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  pillTextActive: { color: colors.teal300, fontFamily: 'Poppins_700Bold' },
  resultCount: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kindBadge: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kindLabel: { color: colors.teal300, fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  riskyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskyText: { color: colors.yellow, fontSize: 10, fontFamily: 'Poppins_700Bold' },
  dateText: { color: colors.navy400, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  resultTitle: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 14 },
});
