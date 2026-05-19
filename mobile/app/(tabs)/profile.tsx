import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, Field, GlassCard, LinearGradient, Muted, Screen } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function ProfileScreen() {
  const { user, updateProfile, changePassword, isLoading, logout } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const initials = (user?.full_name ?? 'TL')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Hata', 'Ad Soyad boş bırakılamaz.');
      return;
    }
    try {
      await updateProfile(fullName.trim());
      Alert.alert('Başarılı', 'Profilin güncellendi.');
    } catch (e: any) {
      Alert.alert('Güncelleme başarısız', e.response?.data?.detail || e.message);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldur.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Hata', 'Yeni şifre en az 8 karakter olmalı.');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifren değiştirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (e: any) {
      Alert.alert('Şifre değiştirilemedi', e.response?.data?.detail || e.message);
    }
  };

  return (
    <Screen withOrbs>
      {/* Back button */}
      <FadeIn delay={0}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" color={colors.teal300} size={20} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
      </FadeIn>
      {/* Avatar hero */}
      <FadeIn delay={0}>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#2dd4bf', '#0fb8a5', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Muted>{user?.email}</Muted>
          <View style={[styles.badge, user?.is_premium ? styles.badgePremium : styles.badgeFree]}>
            {user?.is_premium && <Ionicons name="star" color={colors.yellow} size={11} />}
            <Text style={[styles.badgeText, user?.is_premium && { color: colors.yellow }]}>
              {user?.is_premium ? 'Premium Üye' : 'Ücretsiz Plan'}
            </Text>
          </View>
        </View>
      </FadeIn>

      {/* Profile edit */}
      <FadeIn delay={120}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="person-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Profil Bilgileri</Text>
          </View>
          <Field
            label="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Adın ve soyadın"
            icon={<Ionicons name="person-outline" color={colors.navy400} size={18} />}
          />
          <AppButton
            title="Kaydet"
            onPress={handleSaveProfile}
            loading={isLoading}
            icon={<Ionicons name="checkmark-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {/* Password change */}
      <FadeIn delay={200}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: 'rgba(168,85,247,0.12)', borderColor: 'rgba(168,85,247,0.3)' }]}>
              <Ionicons name="lock-closed-outline" color="#c084fc" size={16} />
            </View>
            <Text style={styles.cardTitle}>Şifre</Text>
          </View>
          {showPasswordForm ? (
            <>
              <Field
                label="Mevcut Şifre"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••"
                icon={<Ionicons name="lock-closed-outline" color={colors.navy400} size={18} />}
              />
              <Field
                label="Yeni Şifre"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="En az 8 karakter"
                icon={<Ionicons name="key-outline" color={colors.navy400} size={18} />}
              />
              <Field
                label="Yeni Şifre (Tekrar)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Tekrar gir"
                icon={<Ionicons name="key-outline" color={colors.navy400} size={18} />}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppButton title="İptal" variant="secondary" onPress={() => setShowPasswordForm(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton title="Değiştir" onPress={handleChangePassword} loading={isLoading} />
                </View>
              </View>
            </>
          ) : (
            <AppButton
              title="Şifreyi Değiştir"
              variant="secondary"
              onPress={() => setShowPasswordForm(true)}
              icon={<Ionicons name="lock-closed-outline" color={colors.white} size={16} />}
            />
          )}
        </GlassCard>
      </FadeIn>

      {/* Account info */}
      <FadeIn delay={280}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' }]}>
              <Ionicons name="information-circle-outline" color={colors.blueLight} size={16} />
            </View>
            <Text style={styles.cardTitle}>Hesap Bilgileri</Text>
          </View>
          <InfoRow icon="mail-outline" label="E-posta" value={user?.email ?? '-'} />
          <InfoRow
            icon="star-outline"
            label="Üyelik"
            value={
              user?.subscription_plan === 'monthly'
                ? 'Premium Aylık'
                : user?.subscription_plan === 'yearly'
                ? 'Premium Yıllık'
                : 'Ücretsiz'
            }
          />
          <InfoRow
            icon="calendar-outline"
            label="Kayıt"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '-'}
          />
        </GlassCard>
      </FadeIn>

      {/* Plan kartı */}
      <FadeIn delay={340}>
        <GlassCard accent={user?.is_premium ? 'yellow' : 'teal'}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardHeaderIcon, user?.is_premium && { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.35)' }]}>
              <Ionicons name="diamond-outline" color={user?.is_premium ? colors.yellow : colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>{user?.is_premium ? 'Premium Aktif' : 'Ücretsiz Plan'}</Text>
          </View>
          <Muted>
            {user?.is_premium
              ? 'Tüm premium özelliklere erişimin var. Planını yönetmek için tıkla.'
              : 'Premium plana geçerek AI çapraz analiz, doktora hazırlan ve daha fazlasına eriş.'}
          </Muted>
          <AppButton
            title={user?.is_premium ? 'Aboneliği Yönet' : 'Planları Görüntüle'}
            onPress={() => router.push('/billing')}
            icon={<Ionicons name={user?.is_premium ? 'card-outline' : 'sparkles-outline'} color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {/* Ayarlar + Çıkış */}
      <FadeIn delay={420}>
        <AppButton
          title="Ayarlar"
          variant="secondary"
          onPress={() => router.push('/settings')}
          icon={<Ionicons name="settings-outline" color={colors.white} size={18} />}
        />
      </FadeIn>

      <FadeIn delay={480}>
        <AppButton
          title="Çıkış Yap"
          variant="danger"
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          icon={<Ionicons name="log-out-outline" color={colors.white} size={18} />}
        />
      </FadeIn>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={colors.navy400} size={16} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
    paddingTop: 12,
  },
  backText: {
    color: colors.teal300,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 12,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.teal500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    color: colors.white,
    fontSize: 34,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  name: {
    color: colors.white,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: 1,
  },
  badgePremium: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
  },
  badgeFree: {
    backgroundColor: 'rgba(29,59,79,0.6)',
    borderColor: 'rgba(159,179,200,0.15)',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(159,179,200,0.06)',
  },
  infoLabel: {
    color: colors.navy400,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  infoValue: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
