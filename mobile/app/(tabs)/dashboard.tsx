import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, Card, Muted, Screen, Title } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import useDashboardStore from '../../src/stores/dashboardStore';
import useRiskAlertStore from '../../src/stores/riskAlertStore';
import useNotificationStore from '../../src/stores/notificationStore';
import { colors } from '../../src/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { summary, fetchSummary, isLoading } = useDashboardStore();
  const { alerts, fetchAlerts, dismissAlert } = useRiskAlertStore();
  const { items: notifications, fetchNotifications } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useFocusEffect(
    useCallback(() => {
      fetchSummary().catch((error) => Alert.alert('Dashboard yüklenemedi', error.message));
      fetchAlerts().catch(() => {});
      fetchNotifications().catch(() => {});
    }, [fetchSummary, fetchAlerts, fetchNotifications]),
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ gap: 4, flex: 1 }}>
          <Title>Merhaba, {user?.full_name?.split(' ')[0] || 'TanıLog'}</Title>
          <Muted>Bugünkü sağlık akışın burada.</Muted>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" color={colors.navy300} size={22} />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} style={styles.avatarBtn}>
            <Text style={styles.avatarText}>
              {(user?.full_name ?? 'TL').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <Metric label="Toplam kayıt" value={summary?.counts?.total_records ?? 0} />
        <Metric label="Belge" value={summary?.counts?.documents ?? 0} />
        <Metric label="Bugün ilaç" value={summary?.today?.medications ?? 0} />
        <Metric label="Alındı" value={summary?.today?.medications_taken ?? 0} />
      </View>

      {alerts.length > 0 && (
        <View style={{ gap: 8 }}>
          {alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.severity === 'high' ? colors.red : colors.yellow }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Muted>{alert.description}</Muted>
              </View>
              <Pressable onPress={() => dismissAlert(alert.id)} style={styles.dismissBtn}>
                <Ionicons name="close" color={colors.navy400} size={18} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Son aktiviteler</Text>
        {summary?.activities?.length ? summary.activities.map((item, index) => (
          <View key={`${item.kind}-${index}`} style={styles.row}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Muted>{item.description}</Muted>
          </View>
        )) : <Muted>Henüz aktivite yok.</Muted>}
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Veri kalitesi</Text>
        {summary?.data_quality?.length ? summary.data_quality.map((item, index) => (
          <View key={`${item.kind}-${index}`} style={styles.row}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Muted>{item.description}</Muted>
          </View>
        )) : <Muted>Bugün için önemli bir eksik görünmüyor.</Muted>}
      </Card>
      <AppButton title="Çıkış Yap" variant="secondary" onPress={handleLogout} />
      {isLoading ? <Muted>Yenileniyor...</Muted> : null}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  alertCard: {
    backgroundColor: colors.navy850,
    borderWidth: 1,
    borderColor: colors.navy700,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  dismissBtn: {
    padding: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy850,
    padding: 16,
  },
  metricValue: {
    color: colors.teal300,
    fontSize: 28,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.navy300,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.navy700,
    paddingTop: 10,
    gap: 4,
  },
  itemTitle: {
    color: colors.white,
    fontWeight: '800',
  },
});
