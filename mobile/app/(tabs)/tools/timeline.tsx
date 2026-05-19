import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn, GlassCard, Muted, Screen } from '../../../src/components/ui';
import useTimelineStore from '../../../src/stores/timelineStore';
import { colors } from '../../../src/theme';

const DAY_OPTIONS = [
  { label: '7 Gün', value: 7 },
  { label: '30 Gün', value: 30 },
  { label: '90 Gün', value: 90 },
];

const KIND_ICON: Record<string, { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; color: string }> = {
  symptom: { icon: 'pulse-outline', color: '#f472b6' },
  medication: { icon: 'medkit-outline', color: colors.teal300 },
  sleep: { icon: 'moon-outline', color: colors.blueLight },
  nutrition: { icon: 'restaurant-outline', color: '#c084fc' },
  document: { icon: 'document-text-outline', color: colors.blueLight },
};

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
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Geçmiş</Text>
          <Text style={styles.headerTitle}>Zaman Çizelgesi</Text>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <View style={styles.segmentRow}>
          {DAY_OPTIONS.map((opt) => {
            const active = selectedDays === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => handleDaysChange(opt.value)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </FadeIn>

      {isLoading ? (
        <Muted>Yükleniyor...</Muted>
      ) : groups.length === 0 ? (
        <FadeIn delay={100}>
          <GlassCard>
            <View style={{ alignItems: 'center', padding: 20, gap: 8 }}>
              <Ionicons name="time-outline" color={colors.navy400} size={36} />
              <Muted>Bu dönemde kayıt bulunamadı.</Muted>
            </View>
          </GlassCard>
        </FadeIn>
      ) : (
        groups.map((group, gi) => (
          <FadeIn key={group.date} delay={140 + gi * 60}>
            <View style={{ gap: 8 }}>
              <View style={styles.dateRow}>
                <View style={styles.dateDot} />
                <Text style={styles.dateHeader}>{formatDate(group.date)}</Text>
              </View>
              <GlassCard>
                {group.items.map((item, idx) => {
                  const meta = KIND_ICON[item.kind] ?? { icon: 'ellipse-outline' as any, color: colors.teal300 };
                  return (
                    <View key={`${item.kind}-${idx}`} style={[styles.timelineItem, idx > 0 && styles.itemDivider]}>
                      <View style={[styles.kindIcon, { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55` }]}>
                        <Ionicons name={meta.icon} color={meta.color} size={14} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.kindLabel, { color: meta.color }]}>{item.kind_label}</Text>
                          <Text style={styles.itemTime}>
                            {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {item.description ? <Muted>{item.description}</Muted> : null}
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            </View>
          </FadeIn>
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
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.12)',
    backgroundColor: 'rgba(20,40,58,0.55)',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  segmentText: { color: colors.navy300, fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  segmentTextActive: { color: colors.teal300, fontFamily: 'Poppins_700Bold' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  dateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal500 },
  dateHeader: { color: colors.teal300, fontFamily: 'Poppins_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  itemDivider: { borderTopWidth: 1, borderTopColor: 'rgba(159,179,200,0.08)' },
  kindIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  itemTime: { color: colors.navy400, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  itemTitle: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 14 },
});
