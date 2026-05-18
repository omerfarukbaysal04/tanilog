import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Muted, Screen, Title } from '../../../src/components/ui';
import useTimelineStore from '../../../src/stores/timelineStore';
import { colors } from '../../../src/theme';

const DAY_OPTIONS = [
  { label: '7 Gün', value: 7 },
  { label: '30 Gün', value: 30 },
  { label: '90 Gün', value: 90 },
];

export default function TimelineScreen() {
  const [selectedDays, setSelectedDays] = useState(30);
  const { groups, isLoading, fetchTimeline } = useTimelineStore();

  useFocusEffect(
    useCallback(() => {
      fetchTimeline(selectedDays).catch((e) => Alert.alert('Zaman çizelgesi yüklenemedi', e.message));
    }, [fetchTimeline, selectedDays]),
  );

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
    fetchTimeline(days).catch(() => {});
  };

  return (
    <Screen>
      <Title>Zaman Çizelgesi</Title>

      <View style={styles.segmentRow}>
        {DAY_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.segment, selectedDays === opt.value && styles.segmentActive]}
            onPress={() => handleDaysChange(opt.value)}
          >
            <Text style={[styles.segmentText, selectedDays === opt.value && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Muted>Yükleniyor...</Muted>
      ) : groups.length === 0 ? (
        <Muted>Bu dönemde kayıt bulunamadı.</Muted>
      ) : (
        groups.map((group) => (
          <View key={group.date} style={{ gap: 8 }}>
            <Text style={styles.dateHeader}>{formatDate(group.date)}</Text>
            {group.items.map((item, idx) => (
              <View key={`${item.kind}-${idx}`} style={styles.timelineItem}>
                <View style={styles.timelineLine} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.kindLabel}>{item.kind_label}</Text>
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.description ? <Muted>{item.description}</Muted> : null}
                  <Muted>{new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Muted>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy850,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.teal500,
    borderColor: colors.teal500,
  },
  segmentText: {
    color: colors.navy400,
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: colors.white,
  },
  dateHeader: {
    color: colors.teal300,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 8,
  },
  timelineLine: {
    width: 3,
    backgroundColor: colors.teal500,
    borderRadius: 2,
    minHeight: 40,
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
  itemTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
