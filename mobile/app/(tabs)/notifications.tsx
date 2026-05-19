import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, EmptyState, GlassCard, Muted, Screen } from '../../src/components/ui';
import useNotificationStore from '../../src/stores/notificationStore';
import { Notification } from '../../src/types';
import { colors } from '../../src/theme';

function formatNotifTime(item: any): string {
  const raw = item.created_at || item.eventTime || item.event_time;
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
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

  return (
    <Screen onRefresh={handleRefresh} refreshing={refreshing}>
      {unread > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unread} okunmamış</Text>
          </View>
          <AppButton
            title="Tümünü okundu işaretle"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={handleMarkAllRead}
          />
        </View>
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
        items.map((item) => (
          <NotifCard
            key={item.id}
            item={item}
            onPress={() => !item.read && markRead(item.id).catch(() => {})}
          />
        ))
      )}
    </Screen>
  );
}

function NotifCard({ item, onPress }: { item: Notification; onPress: () => void }) {
  const { name: iconName, color: iconColor } = notifIcon(item.type);
  const isUnread = !item.read;

  return (
    <GlassCard
      accent={item.priority === 'important' ? 'yellow' : isUnread ? 'teal' : undefined}
      style={{ ...styles.card, ...(isUnread ? styles.cardUnread : {}) }}
    >
      <View style={styles.row} onTouchEnd={onPress}>
        {/* Sol: önem çizgisi */}
        {item.priority === 'important' && <View style={styles.importantBar} />}

        {/* İkon */}
        <View style={[styles.iconBox, { borderColor: `${iconColor}40`, backgroundColor: `${iconColor}18` }]}>
          <Ionicons name={iconName} color={iconColor} size={18} />
        </View>

        {/* İçerik */}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.title, !isUnread && styles.titleRead]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" color={colors.navy500} size={11} />
            <Text style={styles.time}>{formatNotifTime(item)}</Text>
          </View>
        </View>

        {/* Okunmadı noktası */}
        {isUnread && <View style={styles.unreadDot} />}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  unreadBadge: {
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  unreadBadgeText: {
    color: colors.teal300,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  card: {
    padding: 14,
  },
  cardUnread: {
    backgroundColor: 'rgba(15,184,165,0.06)',
  },
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
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 20,
  },
  titleRead: {
    color: colors.navy300,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    color: colors.navy400,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: {
    color: colors.navy500,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal400,
    marginTop: 6,
    flexShrink: 0,
  },
});
