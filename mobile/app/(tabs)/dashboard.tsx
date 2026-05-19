import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn, GlassCard, LinearGradient, Muted, PremiumPromo, Screen, StatCard } from '../../src/components/ui';
import { fmtShortTR } from '../../src/lib/dateFmt';
import useAuthStore from '../../src/stores/authStore';
import useDashboardStore from '../../src/stores/dashboardStore';
import useRiskAlertStore from '../../src/stores/riskAlertStore';
import useNotificationStore from '../../src/stores/notificationStore';
import useOnboardingStore, { OnboardingStep } from '../../src/stores/onboardingStore';
import { colors } from '../../src/theme';

type QuickAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
};

const ONB_STEPS: { key: OnboardingStep; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'health_profile_done', label: 'Sağlık profili', icon: 'person-outline', route: '/settings' },
  { key: 'notifications_done', label: 'Bildirim izni', icon: 'notifications-outline', route: '/settings' },
  { key: 'first_record_done', label: 'İlk kayıt', icon: 'heart-outline', route: '/health' },
  { key: 'first_document_done', label: 'Belge yükle', icon: 'document-text-outline', route: '/documents' },
  { key: 'ai_permissions_done', label: 'AI izinleri', icon: 'sparkles-outline', route: '/settings' },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Sağlık', icon: 'heart', route: '/health', accent: 'pink' },
  { label: 'Belge', icon: 'document-text', route: '/documents', accent: 'blue' },
  { label: 'Sesli', icon: 'mic', route: '/tools/voice', accent: 'purple' },
  { label: 'Araçlar', icon: 'apps', route: '/tools', accent: 'teal' },
];

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { summary, fetchSummary, isLoading } = useDashboardStore();
  const { alerts, fetchAlerts, dismissAlert } = useRiskAlertStore();
  const { items: notifications, fetchNotifications } = useNotificationStore();
  const { state: onboarding, fetchOnboarding, completeStep, skip: skipOnboarding } = useOnboardingStore();
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const firstName = user?.full_name?.split(' ')[0] || 'Hoşgeldin';
  const greeting = greetingFor();

  useFocusEffect(
    useCallback(() => {
      fetchSummary().catch((error) => Alert.alert('Dashboard yüklenemedi', error.message));
      fetchAlerts().catch(() => {});
      fetchNotifications().catch(() => {});
      fetchOnboarding().catch(() => {});
    }, [fetchSummary, fetchAlerts, fetchNotifications, fetchOnboarding]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchSummary(), fetchAlerts(), fetchNotifications(), fetchOnboarding()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      {/* Header */}
      <FadeIn delay={0}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn}>
              <Ionicons name="notifications-outline" color={colors.white} size={20} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
              <LinearGradient
                colors={['#2dd4bf', '#0fb8a5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarBtn}
              >
                <Text style={styles.avatarText}>
                  {(user?.full_name ?? 'TL').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </FadeIn>

      {/* Hero gradient banner */}
      <FadeIn delay={80}>
        <LinearGradient
          colors={['rgba(15,184,165,0.18)', 'rgba(59,130,246,0.12)', 'rgba(168,85,247,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heroTitle}>Bugünkü Sağlığın</Text>
            <Muted>Tüm sağlık akışın tek bakışta burada.</Muted>
          </View>
          {user?.is_premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" color={colors.yellow} size={12} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </LinearGradient>
      </FadeIn>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <StatCard
            accent="teal"
            delay={120}
            icon={<Ionicons name="layers-outline" color={colors.teal300} size={18} />}
            label="Toplam kayıt"
            value={summary?.counts?.total_records ?? 0}
          />
        </View>
        <View style={styles.statCell}>
          <StatCard
            accent="blue"
            delay={170}
            icon={<Ionicons name="document-text-outline" color={colors.blueLight} size={18} />}
            label="Belge"
            value={summary?.counts?.documents ?? 0}
          />
        </View>
        <View style={styles.statCell}>
          <StatCard
            accent="pink"
            delay={220}
            icon={<Ionicons name="medkit-outline" color="#f472b6" size={18} />}
            label="Bugün ilaç"
            value={summary?.today?.medications ?? 0}
          />
        </View>
        <View style={styles.statCell}>
          <StatCard
            accent="purple"
            delay={270}
            icon={<Ionicons name="checkmark-done-outline" color="#c084fc" size={18} />}
            label="Alındı"
            value={summary?.today?.medications_taken ?? 0}
          />
        </View>
      </View>

      {/* Premium promo (free için, onboarding'den ayrı) */}
      {!user?.is_premium && (
        <FadeIn delay={280}>
          <PremiumPromo text="AI Analiz, Doktor Hazırlık ve Aile Takibi için sınırsız erişim." />
        </FadeIn>
      )}

      {/* Onboarding */}
      {onboarding && !onboarding.is_complete && (
        <FadeIn delay={290}>
          <GlassCard accent="teal">
            <View style={styles.onbHeader}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="rocket" color={colors.teal300} size={16} />
                  <Text style={styles.onbTitle}>Kurulumu Tamamla</Text>
                </View>
                <Muted>
                  {onboarding.completed_count}/{onboarding.total_count} adım bitti
                </Muted>
              </View>
              <Pressable onPress={() => skipOnboarding().catch(() => {})}>
                <Text style={styles.onbSkip}>Atla</Text>
              </Pressable>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(onboarding.completed_count / onboarding.total_count) * 100}%` },
                ]}
              />
            </View>

            {/* Adımlar */}
            <View style={styles.onbSteps}>
              {ONB_STEPS.map((s) => {
                const done = onboarding.steps?.[s.key];
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => {
                      if (!done) completeStep(s.key).catch(() => {});
                      router.push(s.route as any);
                    }}
                    style={({ pressed }) => [
                      styles.onbStep,
                      done && styles.onbStepDone,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : s.icon}
                      color={done ? colors.teal300 : colors.navy400}
                      size={16}
                    />
                    <Text style={[styles.onbStepText, done && styles.onbStepTextDone]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        </FadeIn>
      )}

      {/* Quick actions */}
      <FadeIn delay={320}>
        <Text style={styles.sectionLabel}>Hızlı Eylemler</Text>
      </FadeIn>
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((q, idx) => (
          <QuickActionCard key={q.label} action={q} delay={340 + idx * 50} />
        ))}
      </View>

      {/* Risk alerts */}
      {alerts.length > 0 && (
        <View style={{ gap: 10 }}>
          <FadeIn delay={400}>
            <Text style={styles.sectionLabel}>Risk Uyarıları</Text>
          </FadeIn>
          {alerts.map((alert, idx) => (
            <FadeIn key={alert.id} delay={420 + idx * 60}>
              <GlassCard accent={alert.severity === 'high' ? 'red' : 'yellow'}>
                <View style={styles.alertRow}>
                  <View style={[styles.alertIconBg, alert.severity === 'high' && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                    <Ionicons
                      name="warning"
                      color={alert.severity === 'high' ? colors.red : colors.yellow}
                      size={18}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Muted>{alert.description || (alert as any).message || (alert as any).detail || 'Risk uyarısı'}</Muted>
                  </View>
                  <Pressable onPress={() => dismissAlert(alert.id)} style={styles.dismissBtn}>
                    <Ionicons name="close" color={colors.navy400} size={18} />
                  </Pressable>
                </View>
              </GlassCard>
            </FadeIn>
          ))}
        </View>
      )}

      {/* Recent activities */}
      <FadeIn delay={500}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="pulse-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Son Aktiviteler</Text>
          </View>
          {summary?.activities?.length ? (
            summary.activities.slice(0, 5).map((item: any, index: number) => (
              <ActivityRow
                key={`${item.kind}-${index}`}
                item={item}
                isLast={index === Math.min(4, summary.activities.length - 1)}
              />
            ))
          ) : (
            <Muted>Henüz aktivite yok. Sağlık takibine başla.</Muted>
          )}
        </GlassCard>
      </FadeIn>

      {/* Data quality */}
      {summary?.data_quality?.length ? (
        <FadeIn delay={580}>
          <GlassCard accent="yellow">
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' }]}>
                <Ionicons name="information-circle-outline" color={colors.yellow} size={16} />
              </View>
              <Text style={styles.cardTitle}>Veri Kalitesi</Text>
            </View>
            {summary.data_quality.map((item: any, index: number) => (
              <ActivityRow key={`${item.kind}-${index}`} item={item} isLast={index === summary.data_quality.length - 1} />
            ))}
          </GlassCard>
        </FadeIn>
      ) : null}

      {isLoading ? <Muted>Yenileniyor...</Muted> : null}
    </Screen>
  );
}

function QuickActionCard({ action, delay }: { action: QuickAction; delay: number }) {
  const palette = {
    teal: { bg: 'rgba(15,184,165,0.12)', border: 'rgba(15,184,165,0.3)', icon: colors.teal300 },
    blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: colors.blueLight },
    purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', icon: '#c084fc' },
    pink: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', icon: '#f472b6' },
  }[action.accent];

  return (
    <FadeIn delay={delay} style={styles.quickCell}>
      <Pressable
        onPress={() => router.push(action.route as any)}
        style={({ pressed }) => [
          styles.quickCard,
          { borderColor: palette.border },
          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        ]}
      >
        <View style={[styles.quickIcon, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <Ionicons name={action.icon} color={palette.icon} size={22} />
        </View>
        <Text style={styles.quickLabel}>{action.label}</Text>
      </Pressable>
    </FadeIn>
  );
}

const TR: Record<string, string> = {
  'Symptom logged': 'Semptom kaydedildi',
  'Medication logged': 'İlaç kaydedildi',
  'Sleep logged': 'Uyku kaydedildi',
  'Nutrition logged': 'Beslenme kaydedildi',
  'Medication taken': 'İlaç alındı',
  'Document uploaded': 'Belge yüklendi',
  'Health record added': 'Sağlık kaydı eklendi',
  breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam Yemeği', snack: 'Atıştırmalık',
  morning: 'Sabah', afternoon: 'Öğleden sonra', evening: 'Akşam', night: 'Gece',
  medication: 'ilaç', symptom: 'semptom', sleep: 'uyku', nutrition: 'beslenme',
};
function trText(text: string): string {
  if (!text) return text;
  let t = text;
  for (const [en, tr] of Object.entries(TR)) {
    t = t.replace(new RegExp(`\\b${en}\\b`, 'gi'), tr);
  }
  return t;
}

function ActivityRow({ item, isLast }: { item: any; isLast: boolean }) {
  const timeLabel = item.created_at ? fmtShortTR(item.created_at) : null;
  return (
    <View style={[styles.activityRow, !isLast && styles.activityDivider]}>
      <View style={styles.activityDot} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.activityTitle}>{trText(item.title)}</Text>
        <Muted>{trText(item.description)}</Muted>
      </View>
      {timeLabel ? (
        <View style={styles.activityTime}>
          <Ionicons name="time-outline" color={colors.navy500} size={10} />
          <Text style={styles.activityTimeText}>{timeLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function greetingFor() {
  const tr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false });
  const h = parseInt(tr, 10);
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    gap: 12,
  },
  greeting: {
    color: colors.navy400,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  name: {
    color: colors.white,
    fontSize: 22,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(29,59,79,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.red,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.navy900,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: 'Poppins_800ExtraBold',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.teal500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.25)',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  premiumText: {
    color: colors.yellow,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  statCell: {
    width: '50%',
    padding: 5,
  },
  sectionLabel: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  quickCell: {
    width: '50%',
    padding: 5,
  },
  quickCard: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
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
  cardTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
  },
  activityDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(159,179,200,0.08)',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal500,
    marginTop: 6,
  },
  activityTitle: {
    color: colors.white,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  activityTimeText: {
    color: colors.navy500,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  dismissBtn: {
    padding: 4,
  },
  onbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  onbTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  onbSkip: {
    color: colors.navy400,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal400,
    borderRadius: 3,
  },
  onbSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  onbStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.15)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexGrow: 1,
  },
  onbStepDone: {
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  onbStepText: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  onbStepTextDone: {
    color: colors.teal300,
    fontFamily: 'Poppins_700Bold',
  },
});
