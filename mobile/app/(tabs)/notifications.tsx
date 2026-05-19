import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, EmptyState, FadeIn, GlassCard, Muted, Screen } from '../../src/components/ui';
import useNotificationStore from '../../src/stores/notificationStore';
import { Notification } from '../../src/types';
import { fmtShortTR } from '../../src/lib/dateFmt';
import { colors } from '../../src/theme';

function formatNotifTime(item: any): string {
  return fmtShortTR(item.created_at || item.eventTime || item.event_time);
}

function notifIcon(type: string): { name: keyof typeof Ionicons.glyphMap; color: string } {
  if (type.includes('risk') || type.includes('alert')) return { name: 'warning', color: colors.yellow };
  if (type.includes('medication') || type.includes('reminder')) return { name: 'medkit', color: colors.teal300 };
  if (type.includes('family') || type.includes('invite')) return { name: 'people', color: '#c084fc' };
  if (type.includes('document') || type.includes('report')) return { name: 'document-text', color: colors.blueLight };
  if (type.includes('ai') || type.includes('analysis')) return { name: 'sparkles', color: '#f472b6' };
  return { name: 'notifications', color: colors.teal300 };
}

export default function NotificationsScreen() {
  const { items, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications().catch((e) => Alert.alert('Bildirimler yüklenemedi', e.message));
    }, [fetchNotifications]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const unread = items.filter((n) => !n.read).length;

  const handlePress = (item: any) => {
    if (!item.read) markRead(item.id).catch(() => {});
    const route = item.route;
    if (typeof route === 'string' && route.length > 0) {
      try { router.push(route as any); } catch {}
    }
  };

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Merkez</Text>
          <Text style={styles.title}>Bildirimler</Text>
          <Muted>{unread > 0 ? `${unread} okunmamış bildirim` : 'Tüm bildirimler okundu'}</Muted>
        </View>
      </FadeIn>

      {unread > 0 && (
        <FadeIn delay={60}>
          <View style={styles.actionsRow}>
            <View style={styles.unreadBadge}>
              <View style={styles.unreadDot} />
              <Text style={styles.unreadBadgeText}>{unread} okunmamış</Text>
            </View>
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done" color={colors.teal300} size={14} />
              <Text style={styles.markAllText}>Tümünü okundu işaretle</Text>
            </Pressable>
          </View>
        </FadeIn>
      )}

      {isLoading && items.length === 0 ? (
        <Muted>Yükleniyor...</Muted>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="notifications-off-outline" color={colors.teal300} size={28} />}
          title="Bildirim yok"
          description="Henüz hiç bildirim almadın. Sağlık takibin aktifleştikçe burada görünecek."
        />
      ) : (
        items.map((item, idx) => (
          <FadeIn key={item.id} delay={80 + idx * 40}>
            <NotifCard item={item} onPress={() => handlePress(item)} />
          </FadeIn>
        ))
      )}
    </Screen>
  );
}

function NotifCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { name: iconName, color: iconColor } = notifIcon(item.type);
  const isUnread = !item.read;
  const hasRoute = typeof item.route === 'string' && item.route.length > 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <GlassCard
        accent={item.priority === 'important' ? 'yellow' : isUnread ? 'teal' : undefined}
        style={{ ...styles.card, ...(isUnread ? styles.cardUnread : {}) }}
      >
        <View style={styles.row}>
          {item.priority === 'important' && <View style={styles.importantBar} />}

          <View style={[styles.iconBox, { borderColor: `${iconColor}40`, backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={iconName} color={iconColor} size={18} />
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.title2, !isUnread && styles.titleRead]} numberOfLines={1}>{item.title}</Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" color={colors.navy500} size={11} />
                <Text style={styles.time}>{formatNotifTime(item)}</Text>
              </View>
              {hasRoute && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={styles.routeText}>Görüntüle</Text>
                  <Ionicons name="chevron-forward" color={colors.teal300} size={12} />
                </View>
              )}
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 4, gap: 4 },
  eyebrow: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderColor: 'rgba(15,184,165,0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unreadBadgeText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,40,58,0.7)',
    borderColor: 'rgba(15,184,165,0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  markAllText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  card: { padding: 14 },
  cardUnread: { backgroundColor: 'rgba(15,184,165,0.08)' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  importantBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.yellow,
    borderRadius: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title2: {
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  titleRead: {
    color: colors.navy300,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    color: colors.navy400,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 4,
  },
  time: {
    color: colors.navy500,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  routeText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.teal400,
    shadowColor: colors.teal400,
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
});
