import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { AppButton, Field, Screen } from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';

export default function AddMemberScreen() {
  const { addMember, isSaving } = useFamilyStore();
  const [fullName, setFullName] = useState('');
  const [relation, setRelation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = async () => {
    if (!fullName.trim() || !relation.trim()) {
      Alert.alert('Hata', 'Ad Soyad ve yakınlık ilişkisi zorunludur.');
      return;
    }
    try {
      await addMember({
        full_name: fullName.trim(),
        relation: relation.trim(),
        birth_year: birthYear ? parseInt(birthYear, 10) : null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Eklenemedi', e.response?.data?.detail || e.message);
    }
  };

  return (
    <Screen>
      <Field label="Ad Soyad *" value={fullName} onChangeText={setFullName} placeholder="Örn: Ayşe Yılmaz" />
      <Field label="Yakınlık İlişkisi *" value={relation} onChangeText={setRelation} placeholder="Örn: Anne, Baba, Eş" />
      <Field label="Doğum Yılı" value={birthYear} onChangeText={setBirthYear} keyboardType="numeric" placeholder="1960" />
      <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+90 5XX XXX XX XX" />
      <Field label="Notlar" value={notes} onChangeText={setNotes} multiline placeholder="Kronik hastalıklar, alerjiler..." />
      <AppButton title="Ekle" onPress={handleAdd} loading={isSaving} />
    </Screen>
  );
}
