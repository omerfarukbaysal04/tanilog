import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen, ToggleRow } from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';

export default function InviteScreen() {
  const { sendInvitation, isSaving } = useFamilyStore();
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [message, setMessage] = useState('');
  const [canViewDocs, setCanViewDocs] = useState(true);
  const [canAddRecords, setCanAddRecords] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !relation.trim()) {
      Alert.alert('Hata', 'E-posta ve yakınlık ilişkisi zorunludur.');
      return;
    }
    try {
      await sendInvitation({
        invitee_email: email.trim(),
        relation: relation.trim(),
        can_view_documents: canViewDocs,
        can_add_records: canAddRecords,
        message: message.trim() || undefined,
      });
      Alert.alert('Davet Gönderildi', `${email} adresine davet gönderildi.`);
      router.back();
    } catch (e: any) {
      Alert.alert('Gönderilemedi', e.response?.data?.detail || e.message);
    }
  };

  return (
    <Screen>
      <Muted>Daveti kabul eden TanıLog kullanıcısı, sağlık verilerini seninle paylaşabilecek.</Muted>

      <Field label="E-posta *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="ornek@mail.com" />
      <Field label="Yakınlık İlişkisi *" value={relation} onChangeText={setRelation} placeholder="Örn: Oğul, Kız, Kardeş" />
      <Field label="Mesaj (opsiyonel)" value={message} onChangeText={setMessage} multiline placeholder="Davet mesajı..." />

      <Card>
        <ToggleRow label="Belgeleri görüntüleyebilsin" value={canViewDocs} onValueChange={setCanViewDocs} description="Tıbbi belgelerine erişim" />
        <ToggleRow label="Kayıt ekleyebilsin" value={canAddRecords} onValueChange={setCanAddRecords} description="Sağlık kaydı oluşturabilir" />
      </Card>

      <AppButton title="Davet Gönder" onPress={handleSend} loading={isSaving} />
    </Screen>
  );
}
