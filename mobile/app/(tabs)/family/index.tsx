import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, EmptyState, FadeIn, GlassCard, LinearGradient, Muted, Screen } from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

export default function FamilyIndexScreen() {
  const { user } = useAuthStore();
  const {
    members,
    sentInvitations,
    receivedAccesses,
    fetchMembers,
    fetchSentInvitations,
    fetchReceivedAccesses,
    deleteMember,
    cancelInvitation,
    revokeAccess,
    selectMember,
  } = useFamilyStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.is_premium) return;
      fetchMembers().catch(() => {});
      fetchSentInvitations().catch(() => {});
      fetchReceivedAccesses().catch(() => {});
    }, [fetchMembers, fetchSentInvitations, fetchReceivedAccesses, user?.is_premium]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMembers(), fetchSentInvitations(), fetchReceivedAccesses()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (!user?.is_premium) {
    return (
      <Screen withOrbs>
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Aile</Text>
            <Text style={styles.title}>Aile Takibi</Text>
          </View>
        </FadeIn>
        <FadeIn delay={100}>
          <GlassCard accent="yellow">
            <View style={styles.gateContent}>
              <View style={styles.gateIcon}>
                <Ionicons name="people" color={colors.yellow} size={32} />
              </View>
              <Text style={styles.gateTitle}>Premium Özellik</Text>
              <Muted>
                Aile takibi özelliği Premium üyelere özeldir. Yakınlarınızın sağlığını takip
                edebilir, kayıt ekleyebilir ve rapor oluşturabilirsiniz.
              </Muted>
              <AppButton
                title="Premium'a Geç"
                onPress={() => router.push('/billing')}
                icon={<Ionicons name="star-outline" color={colors.white} size={18} />}
              />
            </View>
          </GlassCard>
        </FadeIn>
      </Screen>
    );
  }

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Premium</Text>
          <Text style={styles.title}>Aile Takibi</Text>
          <Muted>Yakınlarının sağlığını takip et, davet gönder.</Muted>
        </View>
      </FadeIn>

      {/* Hızlı eylemler */}
      <FadeIn delay={60}>
        <View style={styles.quickRow}>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => router.push('/family/add-member')}
              style={({ pressed }) => [styles.quickCard, { borderColor: 'rgba(15,184,165,0.35)' }, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: 'rgba(15,184,165,0.18)', borderColor: 'rgba(15,184,165,0.4)' }]}>
                <Ionicons name="person-add" color={colors.teal300} size={20} />
              </View>
              <Text style={styles.quickLabel}>Üye Ekle</Text>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => router.push('/family/invite')}
              style={({ pressed }) => [styles.quickCard, { borderColor: 'rgba(168,85,247,0.35)' }, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: 'rgba(168,85,247,0.18)', borderColor: 'rgba(168,85,247,0.4)' }]}>
                <Ionicons name="mail" color="#c084fc" size={20} />
              </View>
              <Text style={styles.quickLabel}>Davet Gönder</Text>
            </Pressable>
          </View>
        </View>
      </FadeIn>

      {/* Aile Üyeleri */}
      <FadeIn delay={120}>
        <Text style={styles.sectionLabel}>Aile Üyeleri ({members.length})</Text>
      </FadeIn>

      {members.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="people-outline" color={colors.teal300} size={28} />}
          title="Henüz aile üyesi yok"
          description="Manuel üye ekleyebilir veya başka bir TanıLog kullanıcısına davet gönderebilirsin."
        />
      ) : (
        members.map((member, idx) => (
          <FadeIn key={member.id} delay={160 + idx * 60}>
            <GlassCard>
              <Pressable
                onPress={() => {
                  selectMember(member);
                  router.push('/family/member');
                }}
                style={styles.memberRow}
              >
                <LinearGradient
                  colors={['#2dd4bf', '#0fb8a5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.memberAvatar}
                >
                  <Text style={styles.memberAvatarText}>
                    {member.full_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.memberName}>{member.full_name}</Text>
                  <View style={styles.memberMeta}>
                    <View style={styles.relationBadge}>
                      <Text style={styles.relationText}>{member.relation}</Text>
                    </View>
                    {member.birth_year && (
                      <Text style={styles.metaText}>
                        {new Date().getFullYear() - member.birth_year} yaş
                      </Text>
                    )}
                    {member.linked_user_id && (
                      <View style={styles.linkedBadge}>
                        <Ionicons name="link" color={colors.teal300} size={10} />
                        <Text style={styles.linkedText}>Bağlı</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    Alert.alert('Üyeyi Sil', `${member.full_name} silinsin mi?`, [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: () => deleteMember(member.id).catch((e) => Alert.alert('Hata', e.message)),
                      },
                    ])
                  }
                  style={styles.deleteIconBtn}
                >
                  <Ionicons name="trash-outline" color={colors.redLight} size={16} />
                </Pressable>
                <Ionicons name="chevron-forward" color={colors.navy400} size={18} />
              </Pressable>
            </GlassCard>
          </FadeIn>
        ))
      )}

      {/* Gönderilen Davetler */}
      <FadeIn delay={300}>
        <Text style={styles.sectionLabel}>Gönderilen Davetler ({sentInvitations.length})</Text>
      </FadeIn>

      {sentInvitations.length === 0 ? (
        <Muted>Henüz davet göndermedin.</Muted>
      ) : (
        sentInvitations.map((inv, idx) => (
          <FadeIn key={inv.id} delay={340 + idx * 50}>
            <GlassCard accent={inv.status === 'pending' ? 'yellow' : inv.status === 'accepted' ? 'teal' : undefined}>
              <View style={styles.invRow}>
                <View style={styles.invIconBg}>
                  <Ionicons name="mail-outline" color={colors.teal300} size={16} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.invEmail}>{inv.invitee_email}</Text>
                  <View style={styles.invMetaRow}>
                    <Text style={styles.metaText}>{inv.relation}</Text>
                    <View style={[styles.statusPill, statusPillStyle(inv.status)]}>
                      <Text style={[styles.statusPillText, statusPillText(inv.status)]}>
                        {statusLabel(inv.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                {inv.status === 'pending' && (
                  <Pressable
                    hitSlop={10}
                    onPress={() => cancelInvitation(inv.id).catch(() => {})}
                    style={styles.cancelBtn}
                  >
                    <Ionicons name="close" color={colors.redLight} size={16} />
                  </Pressable>
                )}
              </View>
            </GlassCard>
          </FadeIn>
        ))
      )}

      {/* Bana Verilen Erişimler */}
      {receivedAccesses.length > 0 && (
        <>
          <FadeIn delay={460}>
            <Text style={styles.sectionLabel}>Beni Takip Edenler</Text>
          </FadeIn>
          {receivedAccesses.map((access, idx) => (
            <FadeIn key={access.id} delay={500 + idx * 50}>
              <GlassCard>
                <View style={styles.invRow}>
                  <View style={[styles.invIconBg, { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.35)' }]}>
                    <Ionicons name="people-outline" color="#c084fc" size={16} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.invEmail}>{access.inviter.full_name}</Text>
                    <Text style={styles.metaText}>{access.relation} · {access.inviter.email}</Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      Alert.alert(
                        'Erişimi Kaldır',
                        `${access.inviter.full_name} artık verilerini göremeyecek.`,
                        [
                          { text: 'İptal', style: 'cancel' },
                          { text: 'Kaldır', style: 'destructive', onPress: () => revokeAccess(access.id).catch(() => {}) },
                        ],
                      )
                    }
                    style={styles.cancelBtn}
                  >
                    <Ionicons name="shield-outline" color={colors.redLight} size={16} />
                  </Pressable>
                </View>
              </GlassCard>
            </FadeIn>
          ))}
        </>
      )}
    </Screen>
  );
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'Beklemede', accepted: 'Kabul Edildi', declined: 'Reddedildi', cancelled: 'İptal',
  };
  return map[s] ?? s;
}

function statusPillStyle(s: string) {
  if (s === 'pending') return { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)' };
  if (s === 'accepted') return { backgroundColor: 'rgba(15,184,165,0.15)', borderColor: 'rgba(15,184,165,0.4)' };
  return { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)' };
}
function statusPillText(s: string) {
  if (s === 'pending') return { color: colors.yellow };
  if (s === 'accepted') return { color: colors.teal300 };
  return { color: colors.redLight };
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
  gateContent: {
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  gateIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  sectionLabel: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_800ExtraBold',
  },
  memberName: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  relationBadge: {
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relationText: {
    color: colors.teal300,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(15,184,165,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  linkedText: {
    color: colors.teal300,
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  metaText: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  invIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invEmail: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  invMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
