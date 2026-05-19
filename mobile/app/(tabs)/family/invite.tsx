import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, Field, GlassCard, Muted, Screen, ToggleRow } from '../../../src/components/ui';
import useFamilyStore from '../../../src/stores/familyStore';
import { colors } from '../../../src/theme';

const COMMON_RELATIONS = ['Eş', 'Anne', 'Baba', 'Çocuk', 'Kardeş', 'Diğer'];

export default function InviteScreen() {
  const { sendInvitation, isSaving } = useFamilyStore();
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [message, setMessage] = useState('');
  const [canViewDocs, setCanViewDocs] = useState(true);
  const [canAddRecords, setCanAddRecords] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !relation.trim()) {
      Alert.alert('Eksik bilgi', 'E-posta ve yakınlık ilişkisi zorunludur.');
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
      Alert.alert('Davet Gönderildi ✓', `${email} adresine davet gönderildi. Davet kabul edildiğinde aile listende görünecek.`);
      router.back();
    } catch (e: any) {
      Alert.alert('Gönderilemedi', e.response?.data?.detail || e.message);
    }
  };

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Aile</Text>
          <Text style={styles.title}>Davet Gönder</Text>
          <Muted>TanıLog kullanıcısına davet gönder, kabul ettiğinde sağlık verilerinize karşılıklı erişim sağlanır.</Muted>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="mail" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Davet Bilgileri</Text>
          </View>

          <Field
            label="E-posta *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="ornek@mail.com"
            icon={<Ionicons name="at" color={colors.navy400} size={18} />}
          />

          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Yakınlık İlişkisi *</Text>
            <View style={styles.pillRow}>
              {COMMON_RELATIONS.map((r) => (
                <PillBtn key={r} label={r} active={relation === r} onPress={() => setRelation(r)} />
              ))}
            </View>
            <Field
              value={relation}
              onChangeText={setRelation}
              placeholder="Veya kendin yaz..."
            />
          </View>

          <Field
            label="Mesaj (opsiyonel)"
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Davet mesajı..."
          />
        </GlassCard>
      </FadeIn>

      <FadeIn delay={140}>
        <GlassCard accent="teal">
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="shield-checkmark" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>İzinler</Text>
          </View>
          <ToggleRow
            label="Belgeleri görüntüleyebilsin"
            value={canViewDocs}
            onValueChange={setCanViewDocs}
            description="Lab sonuçları, reçeteler ve diğer belgelere erişim"
          />
          <ToggleRow
            label="Kayıt ekleyebilsin"
            value={canAddRecords}
            onValueChange={setCanAddRecords}
            description="Sağlık günlüğünüze yeni kayıt oluşturabilir"
          />
        </GlassCard>
      </FadeIn>

      <FadeIn delay={200}>
        <AppButton
          title="Davet Gönder"
          onPress={handleSend}
          loading={isSaving}
          icon={<Ionicons name="paper-plane-outline" color={colors.white} size={18} />}
        />
      </FadeIn>
    </Screen>
  );
}

function PillBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <View
      style={[
        styles.pill,
        active && { backgroundColor: 'rgba(15,184,165,0.18)', borderColor: 'rgba(15,184,165,0.5)' },
      ]}
      onTouchEnd={onPress}
    >
      <Text style={[styles.pillText, active && { color: colors.teal300 }]}>{label}</Text>
    </View>
  );
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
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardIcon: {
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
  label: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  pillText: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
