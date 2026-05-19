import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, Card, Field, Label, Muted, Screen, ToggleRow } from '../../src/components/ui';
import useSettingsStore from '../../src/stores/settingsStore';
import useAuthStore from '../../src/stores/authStore';
import { UserSettings } from '../../src/types';
import api from '../../src/lib/api';
import { isNotificationsAvailable, registerPushToken } from '../../src/lib/notifications';
import { colors } from '../../src/theme';

export default function SettingsScreen() {
  const { settings, isLoading, isSaving, fetchSettings, updateSettings, exportAccountData, deleteAccount } =
    useSettingsStore();
  const { logout } = useAuthStore();

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleTestPush = async () => {
    if (!isNotificationsAvailable()) {
      Alert.alert('Bildirim modülü yok', 'Yeni bir dev build alman gerekiyor (expo-notifications).');
      return;
    }
    setTestingPush(true);
    try {
      // 1) Token alımı + backend kayıt
      const token = await registerPushToken();
      if (!token) {
        Alert.alert(
          'Push hazırlanamadı',
          'Token alınamadı veya backend\'e kaydedilemedi.\n\n' +
          '• Bildirim izni verilmiş mi?\n' +
          '• Firebase ayarı tamam mı?\n' +
          '• İnternet bağlantın var mı?',
        );
        return;
      }
      // 2) Test bildirimi
      await api.post('/push/expo/test');
      Alert.alert(
        'Test gönderildi ✓',
        'Birkaç saniye içinde bildirim ulaşmalı. Telefona düşmezse Bildirim Merkezi\'nde göreceksin.',
      );
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      Alert.alert(
        'Push gönderilemedi',
        detail || e?.message || 'Beklenmeyen bir hata oluştu.',
      );
    } finally {
      setTestingPush(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings().catch((e) => Alert.alert('Ayarlar yüklenemedi', e.message));
    }, [fetchSettings]),
  );

  const toggle = (key: keyof UserSettings) => async (val: boolean) => {
    if (!settings) return;
    try {
      await updateSettings({ [key]: val });
    } catch (e: any) {
      Alert.alert('Güncelleme başarısız', e.response?.data?.detail || e.message);
    }
  };

  const handleSaveHealthProfile = async () => {
    if (!settings) return;
    try {
      await updateSettings({
        birth_year: settings.birth_year,
        biological_sex: settings.biological_sex,
        height_cm: settings.height_cm,
        weight_kg: settings.weight_kg,
        blood_type: settings.blood_type,
        chronic_conditions: settings.chronic_conditions,
        allergies: settings.allergies,
        emergency_contact_name: settings.emergency_contact_name,
        emergency_contact_phone: settings.emergency_contact_phone,
      });
      Alert.alert('Başarılı', 'Sağlık profili kaydedildi.');
    } catch (e: any) {
      Alert.alert('Kayıt başarısız', e.response?.data?.detail || e.message);
    }
  };

  const handleExport = async () => {
    try {
      await exportAccountData();
    } catch (e: any) {
      Alert.alert('Dışa aktarma başarısız', e.response?.data?.detail || e.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'HESABIMI SIL') {
      Alert.alert('Hata', '"HESABIMI SIL" yazmanız gerekiyor.');
      return;
    }
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(deletePassword, deleteConfirmation);
              await logout();
              router.replace('/login');
            } catch (e: any) {
              Alert.alert('Silme başarısız', e.response?.data?.detail || e.message);
            }
          },
        },
      ],
    );
  };

  const setField = (key: keyof NonNullable<typeof settings>) => (val: string) => {
    if (!settings) return;
    useSettingsStore.setState({ settings: { ...settings, [key]: val || null } });
  };

  const setNumField = (key: keyof NonNullable<typeof settings>) => (val: string) => {
    if (!settings) return;
    const num = parseInt(val, 10);
    useSettingsStore.setState({ settings: { ...settings, [key]: isNaN(num) ? null : num } });
  };

  if (isLoading && !settings) {
    return (
      <Screen>
        <Muted>Yükleniyor...</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Bildirimler */}
      <Card>
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        {settings && (
          <>
            <ToggleRow
              label="Bildirimler"
              value={settings.notifications_enabled}
              onValueChange={toggle('notifications_enabled')}
              description="Uygulama bildirimlerini aç/kapat"
            />
            <ToggleRow
              label="Sesli bildirimler"
              value={settings.voice_notifications_enabled}
              onValueChange={toggle('voice_notifications_enabled')}
            />
            <ToggleRow
              label="İlaç hatırlatıcı"
              value={settings.medication_reminders_enabled}
              onValueChange={toggle('medication_reminders_enabled')}
            />
            <ToggleRow
              label="Aile daveti bildirimleri"
              value={settings.family_invite_notifications_enabled}
              onValueChange={toggle('family_invite_notifications_enabled')}
            />
            <ToggleRow
              label="Sessiz saatler"
              value={settings.quiet_hours_enabled}
              onValueChange={toggle('quiet_hours_enabled')}
              description="Belirtilen saatler arasında bildirim gönderilmez"
            />
            {settings.quiet_hours_enabled && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Başlangıç"
                    value={settings.quiet_hours_start ?? ''}
                    onChangeText={setField('quiet_hours_start')}
                    placeholder="22:00"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Bitiş"
                    value={settings.quiet_hours_end ?? ''}
                    onChangeText={setField('quiet_hours_end')}
                    placeholder="08:00"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            )}
            <View style={{ height: 8 }} />
            <AppButton
              title="Test Bildirimi Gönder"
              variant="secondary"
              onPress={handleTestPush}
              loading={testingPush}
            />
            <Muted>
              {isNotificationsAvailable()
                ? 'Sunucudan bir push gönderir. Permission yoksa istenecek.'
                : 'Push için yeni bir dev build alınması gerekir.'}
            </Muted>
          </>
        )}
      </Card>

      {/* AI İzinleri */}
      <Card>
        <Text style={styles.sectionTitle}>AI İzinleri</Text>
        {settings && (
          <>
            <ToggleRow
              label="Sağlık kayıtlarını kullan"
              value={settings.ai_use_health_records}
              onValueChange={toggle('ai_use_health_records')}
              description="AI analizinde sağlık kayıtlarına erişim"
            />
            <ToggleRow
              label="Belgeleri kullan"
              value={settings.ai_use_documents}
              onValueChange={toggle('ai_use_documents')}
              description="AI analizinde yüklenen belgelere erişim"
            />
            <ToggleRow
              label="Doktor raporlarını kullan"
              value={settings.ai_use_doctor_reports}
              onValueChange={toggle('ai_use_doctor_reports')}
            />
            <ToggleRow
              label="Profil bilgilerini kullan"
              value={settings.ai_use_profile}
              onValueChange={toggle('ai_use_profile')}
            />
          </>
        )}
      </Card>

      {/* Sağlık Profili */}
      <Card>
        <Text style={styles.sectionTitle}>Sağlık Profili</Text>
        {settings && (
          <>
            <Field
              label="Doğum Yılı"
              value={settings.birth_year?.toString() ?? ''}
              onChangeText={setNumField('birth_year')}
              keyboardType="numeric"
              placeholder="1990"
            />
            <Field
              label="Biyolojik Cinsiyet"
              value={settings.biological_sex ?? ''}
              onChangeText={setField('biological_sex')}
              placeholder="erkek / kadın"
            />
            <Field
              label="Boy (cm)"
              value={settings.height_cm?.toString() ?? ''}
              onChangeText={setNumField('height_cm')}
              keyboardType="numeric"
              placeholder="175"
            />
            <Field
              label="Kilo (kg)"
              value={settings.weight_kg?.toString() ?? ''}
              onChangeText={setNumField('weight_kg')}
              keyboardType="numeric"
              placeholder="70"
            />
            <Field
              label="Kan Grubu"
              value={settings.blood_type ?? ''}
              onChangeText={setField('blood_type')}
              placeholder="A+, B-, 0+ vb."
            />
            <Field
              label="Kronik Hastalıklar"
              value={settings.chronic_conditions ?? ''}
              onChangeText={setField('chronic_conditions')}
              placeholder="Varsa belirtin..."
              multiline
            />
            <Field
              label="Alerjiler"
              value={settings.allergies ?? ''}
              onChangeText={setField('allergies')}
              placeholder="İlaç, besin vb. alerjiler..."
              multiline
            />
          </>
        )}
      </Card>

      {/* Acil İletişim */}
      <Card>
        <Text style={styles.sectionTitle}>Acil İletişim</Text>
        {settings && (
          <>
            <Field
              label="Ad Soyad"
              value={settings.emergency_contact_name ?? ''}
              onChangeText={setField('emergency_contact_name')}
              placeholder="Acil durumda aranacak kişi"
            />
            <Field
              label="Telefon"
              value={settings.emergency_contact_phone ?? ''}
              onChangeText={setField('emergency_contact_phone')}
              keyboardType="phone-pad"
              placeholder="+90 5XX XXX XX XX"
            />
          </>
        )}
        <AppButton title="Sağlık Profilini Kaydet" onPress={handleSaveHealthProfile} loading={isSaving} />
      </Card>

      {/* Hızlı Erişim */}
      <Card>
        <Text style={styles.sectionTitle}>Diğer</Text>
        <AppButton title="Abonelik ve Premium" variant="secondary" onPress={() => router.push('/billing')} />
        <AppButton title="Aile Takibi" variant="secondary" onPress={() => router.push('/family')} />
      </Card>

      {/* Gizlilik */}
      <Card>
        <Text style={styles.sectionTitle}>Gizlilik ve Güvenlik</Text>
        <AppButton title="Verilerimi Dışa Aktar" variant="secondary" onPress={handleExport} loading={isLoading} />

        {showDeleteForm ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Label>Hesabı kalıcı olarak silmek için şifreni gir</Label>
            <Field
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="Şifren"
            />
            <Field
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder='HESABIMI SIL'
            />
            <Muted>Onaylamak için tam olarak "HESABIMI SIL" yaz</Muted>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppButton title="İptal" variant="secondary" onPress={() => setShowDeleteForm(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton title="Hesabı Sil" variant="danger" onPress={handleDeleteAccount} />
              </View>
            </View>
          </View>
        ) : (
          <AppButton
            title="Hesabı Sil"
            variant="danger"
            onPress={() => setShowDeleteForm(true)}
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
