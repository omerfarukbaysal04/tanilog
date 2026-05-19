import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn, GlassCard, Muted, Screen } from '../../src/components/ui';
import { colors } from '../../src/theme';

export default function LegalScreen() {
  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Bilgilendirme</Text>
          <Text style={styles.title}>Yasal Metinler</Text>
        </View>
      </FadeIn>

      <FadeIn delay={100}>
        <GlassCard accent="yellow">
          <View style={styles.cardHeader}>
            <View style={styles.iconBg}>
              <Ionicons name="warning-outline" color={colors.yellow} size={18} />
            </View>
            <Text style={styles.cardTitle}>Tıbbi Sorumluluk Reddi</Text>
          </View>
          <Muted>
            TanıLog tıbbi teşhis veya tedavi önerisi vermez. Uygulama içindeki AI çıktıları sadece sağlık kayıtlarını
            düzenlemeye ve doktor görüşmesine hazırlanma sürecine yardımcı olmak için kullanılır.
          </Muted>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={200}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(15,184,165,0.12)', borderColor: 'rgba(15,184,165,0.3)' }]}>
              <Ionicons name="information-circle-outline" color={colors.teal300} size={18} />
            </View>
            <Text style={styles.cardTitle}>Demo Kullanımı</Text>
          </View>
          <Muted>
            Demo sürümünde gerçek sağlık belgesi yerine örnek veya anonimleştirilmiş veri kullanılması önerilir.
            Verileriniz KVKK kapsamında korunur.
          </Muted>
        </GlassCard>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    gap: 4,
  },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
});
