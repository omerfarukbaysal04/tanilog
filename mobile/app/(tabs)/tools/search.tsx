import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, Field, Muted, Screen, Title } from '../../../src/components/ui';
import useSearchStore from '../../../src/stores/searchStore';
import { colors } from '../../../src/theme';

const CATEGORIES = [
  { label: 'Tümü', value: '' },
  { label: 'Semptom', value: 'symptom' },
  { label: 'İlaç', value: 'medication' },
  { label: 'Uyku', value: 'sleep' },
  { label: 'Beslenme', value: 'nutrition' },
  { label: 'Belge', value: 'document' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const { results, isLoading, search, clear } = useSearchStore();

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Uyarı', 'Arama terimi girin.');
      return;
    }
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
    <Screen>
      <Title>Arama</Title>

      <Field
        value={query}
        onChangeText={setQuery}
        placeholder="Semptom, ilaç, belge ara..."
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />

      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.value}
            style={[styles.pill, category === cat.value && styles.pillActive]}
            onPress={() => setCategory(cat.value)}
          >
            <Text style={[styles.pillText, category === cat.value && styles.pillTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 3 }}>
          <AppButton title="Ara" onPress={handleSearch} loading={isLoading} />
        </View>
        {results.length > 0 && (
          <View style={{ flex: 1 }}>
            <AppButton title="Temizle" variant="secondary" onPress={handleClear} />
          </View>
        )}
      </View>

      {results.length > 0 && (
        <View style={{ gap: 8 }}>
          <Muted>{results.length} sonuç bulundu</Muted>
          {results.map((item, idx) => (
            <View key={idx} style={[styles.resultCard, item.is_risky && styles.resultCardRisky]}>
              <View style={styles.resultHeader}>
                <Text style={styles.kindLabel}>{item.kind}</Text>
                {item.is_risky && <Ionicons name="warning" color={colors.yellow} size={14} />}
              </View>
              <Text style={styles.resultTitle}>{item.title}</Text>
              {item.description ? <Muted>{item.description}</Muted> : null}
              <Muted>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Muted>
            </View>
          ))}
        </View>
      )}

      {!isLoading && results.length === 0 && query.length > 0 && (
        <Muted>Sonuç bulunamadı.</Muted>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy850,
  },
  pillActive: {
    backgroundColor: colors.teal500,
    borderColor: colors.teal500,
  },
  pillText: {
    color: colors.navy400,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.white,
  },
  resultCard: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  resultCardRisky: {
    borderLeftWidth: 3,
    borderLeftColor: colors.yellow,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kindLabel: {
    color: colors.teal300,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.navy800,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
