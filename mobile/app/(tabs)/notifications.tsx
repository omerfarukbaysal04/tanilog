import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppButton, Muted, Screen } from '../../src/components/ui';
import useNotificationStore from '../../src/stores/notificationStore';
import { colors } from '../../src/theme';

export default function NotificationsScreen() {
  const { items, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications().catch((e) => Alert.alert('Bildirimler yüklenemedi', e.message));
    }, [fetchNotifications]),
  );

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <Screen>
      <View style={styles.header}>
        {unread > 0 && (
          <AppButton title="Tümünü okundu işaretle" variant="secondary" onPress={handleMarkAllRead} />
        )}
      </View>

      {isLoading && items.length === 0 ? (
        <Muted>Yükleniyor...</Muted>
      ) : items.length === 0 ? (
        <Muted>Henüz bildirim yok.</Muted>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => !item.read && markRead(item.id).catch(() => {})}
            style={[styles.item, !item.read ? styles.itemUnread : styles.itemRead]}
          >
            {item.priority === 'important' && <View style={styles.importantDot} />}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.itemTitle, item.read && styles.itemTitleRead]}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Muted>{new Date(item.created_at).toLocaleString('tr-TR')}</Muted>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  item: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemUnread: {
    backgroundColor: colors.navy800,
    borderColor: colors.navy700,
  },
  itemRead: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
  },
  itemTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  itemTitleRead: {
    fontWeight: '600',
    color: colors.navy300,
  },
  body: {
    color: colors.navy300,
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal500,
    marginTop: 4,
  },
  importantDot: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.yellow,
    borderRadius: 2,
    marginRight: 2,
  },
});
