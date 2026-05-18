import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen } from '../../src/components/ui';
import useAuthStore from '../../src/stores/authStore';
import { colors } from '../../src/theme';

export default function ProfileScreen() {
  const { user, updateProfile, changePassword, isLoading } = useAuthStore();
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
    <Screen>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Muted>{user?.email}</Muted>
          <View style={[styles.badge, user?.is_premium ? styles.badgePremium : styles.badgeFree]}>
            <Text style={styles.badgeText}>{user?.is_premium ? '★ Premium' : 'Ücretsiz'}</Text>
          </View>
        </View>
      </View>

      <Card>
        <Label>Ad Soyad</Label>
        <Field
          value={fullName}
          onChangeText={setFullName}
          placeholder="Adın ve soyadın"
        />
        <AppButton title="Kaydet" onPress={handleSaveProfile} loading={isLoading} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Şifre</Text>
        {showPasswordForm ? (
          <>
            <Field
              label="Mevcut Şifre"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <Field
              label="Yeni Şifre"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <Field
              label="Yeni Şifre (Tekrar)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="••••••••"
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
          <AppButton title="Şifreyi Değiştir" variant="secondary" onPress={() => setShowPasswordForm(true)} />
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
        <View style={{ gap: 6 }}>
          <Muted>E-posta: {user?.email}</Muted>
          <Muted>Üyelik: {user?.subscription_plan === 'premium_monthly' ? 'Premium Aylık' : user?.subscription_plan === 'premium_yearly' ? 'Premium Yıllık' : 'Ücretsiz'}</Muted>
          <Muted>Kayıt tarihi: {user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '-'}</Muted>
        </View>
      </Card>

      <AppButton
        title="Ayarlar"
        variant="secondary"
        onPress={() => router.push('/settings')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
  },
  name: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  badgePremium: {
    backgroundColor: colors.teal500 + '33',
    borderWidth: 1,
    borderColor: colors.teal500,
  },
  badgeFree: {
    backgroundColor: colors.navy700,
    borderWidth: 1,
    borderColor: colors.navy400,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
