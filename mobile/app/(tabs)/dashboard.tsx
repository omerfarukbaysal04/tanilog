import { useCallback } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { AppButton, Card, Muted, Screen, Title } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import useDashboardStore from '../../src/stores/dashboardStore';
import { colors } from '../../src/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { summary, fetchSummary, isLoading } = useDashboardStore();

  useFocusEffect(
    useCallback(() => {
      fetchSummary().catch((error) => Alert.alert('Dashboard yüklenemedi', error.message));
    }, [fetchSummary]),
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>Merhaba, {user?.full_name?.split(' ')[0] || 'TanıLog'}</Title>
        <Muted>Bugünkü sağlık akışın burada.</Muted>
      </View>
      <View style={styles.grid}>
        <Metric label="Toplam kayıt" value={summary?.counts?.total_records ?? 0} />
        <Metric label="Belge" value={summary?.counts?.documents ?? 0} />
        <Metric label="Bugün ilaç" value={summary?.today?.medications ?? 0} />
        <Metric label="Alındı" value={summary?.today?.medications_taken ?? 0} />
      </View>
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
