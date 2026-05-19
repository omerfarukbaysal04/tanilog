import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, GlassCard, LinearGradient, Muted, Screen } from '../../src/components/ui';
import useBillingStore from '../../src/stores/billingStore';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function BillingScreen() {
  const { plans, subscription, events, isLoading, isPurchasing, fetchPlans, fetchSubscription, fetchEvents, purchase, cancel } =
    useBillingStore();
  const { fetchUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  useFocusEffect(
    useCallback(() => {
      fetchPlans().catch(() => {});
      fetchSubscription().catch(() => {});
      fetchEvents().catch(() => {});
    }, [fetchPlans, fetchSubscription, fetchEvents]),
  );

  const handlePurchase = () => {
    Alert.alert(
      'Demo Satın Alma',
      `${plans[selectedPlan]?.name} - ${plans[selectedPlan]?.price} TRY\n\nBu bir test ödemesidir. Gerçek ücret alınmaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Premium Aktifleştir',
          onPress: async () => {
            try {
              await purchase(selectedPlan);
              await fetchUser();
              Alert.alert('Tebrikler', 'Premium üyeliğin aktifleştirildi!');
            } catch (e: any) {
              Alert.alert('Hata', e.response?.data?.detail || e.message);
            }
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Aboneliği İptal Et',
      'Premium üyeliğini sonlandırmak istediğine emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel();
              await fetchUser();
              Alert.alert('İptal Edildi', 'Premium üyeliğin sonlandırıldı.');
            } catch (e: any) {
              Alert.alert('Hata', e.response?.data?.detail || e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Abonelik</Text>
          <Text style={styles.headerTitle}>Premium Planlar</Text>
        </View>
      </FadeIn>

      {/* Mevcut Plan */}
      <FadeIn delay={80}>
        <GlassCard accent={subscription?.is_premium ? 'yellow' : 'teal'}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardHeaderIcon, subscription?.is_premium && { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.35)' }]}>
              <Ionicons
                name={subscription?.is_premium ? 'star' : 'leaf-outline'}
                color={subscription?.is_premium ? colors.yellow : colors.teal300}
                size={16}
              />
            </View>
            <Text style={styles.cardTitle}>Mevcut Plan</Text>
          </View>
          {isLoading && !subscription ? (
            <Muted>Yükleniyor...</Muted>
          ) : subscription?.is_premium ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.premiumLabel}>
                {subscription.subscription_plan === 'monthly' ? 'Premium Aylık' : 'Premium Yıllık'}
              </Text>
              {subscription.premium_until && (
                <Muted>
                  Bitiş: {new Date(subscription.premium_until).toLocaleDateString('tr-TR')} ({subscription.days_remaining} gün kaldı)
                </Muted>
              )}
              <AppButton
                title="Aboneliği İptal Et"
                variant="danger"
                onPress={handleCancel}
                loading={isLoading}
                icon={<Ionicons name="close-circle-outline" color={colors.white} size={18} />}
              />
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={styles.freePlan}>Ücretsiz Plan</Text>
              <Muted>Premium'a geçerek tüm özelliklere eriş.</Muted>
            </View>
          )}
        </GlassCard>
      </FadeIn>

      {/* Plan Seçimi */}
      {!subscription?.is_premium && (
        <>
          <FadeIn delay={160}>
            <Text style={styles.sectionLabel}>Plan Seç</Text>
          </FadeIn>

          {(['monthly', 'yearly'] as const).map((key, idx) => {
            const plan = plans[key];
            if (!plan) return null;
            const isSelected = selectedPlan === key;
            return (
              <FadeIn key={key} delay={200 + idx * 80}>
                <Pressable onPress={() => setSelectedPlan(key)}>
                  <View style={[styles.planCard, isSelected && styles.planCardSelected]}>
                    {isSelected && (
                      <LinearGradient
                        colors={['rgba(15,184,165,0.12)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                    )}
                    <View style={styles.planHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.planName}>{plan.name}</Text>
                          {key === 'yearly' && (
                            <View style={styles.saveBadge}>
                              <Text style={styles.saveBadgeText}>%23 Kazanç</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planPrice}>
                          {plan.price} TRY <Text style={styles.planInterval}>/ {plan.interval === 'month' ? 'ay' : 'yıl'}</Text>
                        </Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <Ionicons name="checkmark" color={colors.white} size={14} />}
                      </View>
                    </View>
                    <View style={{ gap: 6, marginTop: 6 }}>
                      {plan.features.map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" color={colors.teal300} size={14} />
                          <Text style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              </FadeIn>
            );
          })}

          <FadeIn delay={400}>
            <AppButton
              title={`${plans[selectedPlan]?.price ?? ''} TRY - Premium Al (Demo)`}
              onPress={handlePurchase}
              loading={isPurchasing}
              size="lg"
              icon={<Ionicons name="sparkles" color={colors.white} size={18} />}
            />
          </FadeIn>
          <FadeIn delay={460}>
            <View style={styles.demoNote}>
              <Ionicons name="information-circle-outline" color={colors.navy400} size={14} />
              <Text style={styles.demoText}>Bu bir demo. Gerçek ücret alınmaz.</Text>
            </View>
          </FadeIn>
        </>
      )}

      {/* Ücretsiz Plan Özellikleri */}
      {!subscription?.is_premium && plans['free'] && (
        <FadeIn delay={520}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="list-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Ücretsiz Planda</Text>
            </View>
            {plans['free'].features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="remove-circle-outline" color={colors.navy400} size={14} />
                <Text style={[styles.featureText, { color: colors.navy400 }]}>{f}</Text>
              </View>
            ))}
          </GlassCard>
        </FadeIn>
      )}

      {/* İşlem Geçmişi */}
      {events.length > 0 && (
        <FadeIn delay={580}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="receipt-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>İşlem Geçmişi</Text>
            </View>
            {events.slice(0, 5).map((ev, i) => (
              <View key={ev.id} style={[styles.eventRow, i > 0 && styles.eventDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventType}>{eventLabel(ev.event_type)}</Text>
                  <Muted>{new Date(ev.created_at).toLocaleDateString('tr-TR')}</Muted>
                </View>
                <Text style={[styles.eventAmount, ev.status === 'completed' ? styles.eventCompleted : styles.eventPending]}>
                  {ev.amount > 0 ? `${ev.amount} TRY` : '-'}
                </Text>
              </View>
            ))}
          </GlassCard>
        </FadeIn>
      )}
    </Screen>
  );
}

function eventLabel(type: string) {
  const map: Record<string, string> = {
    checkout_created: 'Ödeme Başlatıldı',
    checkout_completed: 'Ödeme Tamamlandı',
    subscription_cancelled: 'Abonelik İptal',
  };
  return map[type] ?? type;
}

const styles = StyleSheet.create({
  header: { paddingTop: 10, paddingBottom: 4, gap: 4 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
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
  cardTitle: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  premiumLabel: { color: colors.yellow, fontFamily: 'Poppins_800ExtraBold', fontSize: 18 },
  freePlan: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 16 },
  sectionLabel: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  planCard: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.12)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  planCardSelected: { borderColor: colors.teal500 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planName: { color: colors.white, fontFamily: 'Poppins_800ExtraBold', fontSize: 17 },
  planPrice: { color: colors.teal300, fontFamily: 'Poppins_700Bold', fontSize: 20, marginTop: 4 },
  planInterval: { color: colors.navy400, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  saveBadge: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: { color: colors.yellow, fontSize: 10, fontFamily: 'Poppins_700Bold' },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(159,179,200,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { backgroundColor: colors.teal500, borderColor: colors.teal500 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  featureText: { color: colors.navy200, fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
  demoNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: -4 },
  demoText: { color: colors.navy400, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  eventDivider: { borderTopWidth: 1, borderTopColor: 'rgba(159,179,200,0.08)' },
  eventType: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  eventAmount: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
  eventCompleted: { color: colors.teal300 },
  eventPending: { color: colors.navy400 },
});
