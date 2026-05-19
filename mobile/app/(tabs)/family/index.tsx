import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, Card, Muted, Screen } from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

export default function FamilyIndexScreen() {
  const { user } = useAuthStore();
  const { members, sentInvitations, receivedAccesses, isLoading, fetchMembers, fetchSentInvitations, fetchReceivedAccesses, deleteMember, cancelInvitation, revokeAccess, selectMember } =
    useFamilyStore();

  useFocusEffect(
    useCallback(() => {
      if (!user?.is_premium) return;
      fetchMembers().catch(() => {});
      fetchSentInvitations().catch(() => {});
      fetchReceivedAccesses().catch(() => {});
    }, [fetchMembers, fetchSentInvitations, fetchReceivedAccesses, user?.is_premium]),
  );

  if (!user?.is_premium) {
    return (
      <Screen>
        <View style={styles.gateCard}>
          <Ionicons name="people-outline" color={colors.teal300} size={48} />
          <Text style={styles.gateTitle}>Premium Özellik</Text>
          <Muted>Aile takibi özelliği Premium üyelere özeldir. Yakınlarınızın sağlığını takip edebilir, kayıt ekleyebilir ve rapor oluşturabilirsiniz.</Muted>
          <AppButton title="Premium'a Geç" onPress={() => router.push('/billing')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Aile Üyeleri</Text>
        <AppButton title="+ Üye Ekle" onPress={() => router.push('/family/add-member')} />
      </View>

      {isLoading && members.length === 0 ? (
        <Muted>Yükleniyor...</Muted>
      ) : members.length === 0 ? (
        <Card>
          <Muted>Henüz aile üyesi eklenmemiş.</Muted>
          <Muted>Manuel üye ekleyebilir veya TanıLog kullanıcısını davet edebilirsin.</Muted>
        </Card>
      ) : (
        members.map((member) => (
          <Pressable
            key={member.id}
            style={({ pressed }) => [styles.memberCard, pressed && { opacity: 0.8 }]}
            onPress={() => {
              selectMember(member);
              router.push('/family/member');
            }}
          >
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {member.full_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.memberName}>{member.full_name}</Text>
              <Muted>{member.relation}{member.birth_year ? ` · ${new Date().getFullYear() - member.birth_year} yaş` : ''}</Muted>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="chevron-forward" color={colors.navy400} size={18} />
              <Pressable
                onPress={() => Alert.alert('Üyeyi Sil', `${member.full_name} silinsin mi?`, [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: () => deleteMember(member.id).catch((e) => Alert.alert('Hata', e.message)) },
                ])}
              >
                <Ionicons name="trash-outline" color={colors.red} size={18} />
              </Pressable>
            </View>
          </Pressable>
        ))
      )}

      {/* Gönderilen Davetler */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Gönderilen Davetler</Text>
        <AppButton title="Davet Gönder" variant="secondary" onPress={() => router.push('/family/invite')} />
      </View>

      {sentInvitations.length === 0 ? (
        <Muted>Gönderilen davet yok.</Muted>
      ) : (
        sentInvitations.map((inv) => (
          <View key={inv.id} style={styles.invCard}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.invEmail}>{inv.invitee_email}</Text>
              <Muted>{inv.relation} · {statusLabel(inv.status)}</Muted>
            </View>
            {inv.status === 'pending' && (
              <Pressable onPress={() => cancelInvitation(inv.id).catch(() => {})}>
                <Ionicons name="close-circle-outline" color={colors.red} size={22} />
              </Pressable>
            )}
          </View>
        ))
      )}

      {/* Bana Verilen Erişimler */}
      {receivedAccesses.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Beni Takip Edenler</Text>
          {receivedAccesses.map((access) => (
            <View key={access.id} style={styles.invCard}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.invEmail}>{access.inviter.full_name}</Text>
                <Muted>{access.relation} · {access.inviter.email}</Muted>
              </View>
              <Pressable onPress={() =>
                Alert.alert('Erişimi Kaldır', `${access.inviter.full_name} artık verilerini göremez.`, [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Kaldır', style: 'destructive', onPress: () => revokeAccess(access.id).catch(() => {}) },
                ])
              }>
                <Ionicons name="shield-outline" color={colors.red} size={22} />
              </Pressable>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: 'Beklemede', accepted: 'Kabul Edildi', declined: 'Reddedildi', cancelled: 'İptal' };
  return map[s] ?? s;
}

const styles = StyleSheet.create({
  gateCard: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  gateTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  memberCard: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  memberName: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  invCard: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invEmail: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
