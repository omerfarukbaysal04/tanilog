import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn, LinearGradient, Muted, Screen } from '../../../src/components/ui';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

type Tool = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
  premium?: boolean;
};

const TOOLS: Tool[] = [
  {
    title: 'Sesli Asistan',
    description: 'Sesli konuşarak hızlıca sağlık kaydı oluştur',
    icon: 'mic-outline',
    route: '/voice',
    accent: 'teal',
  },
  {
    title: 'Zaman Çizelgesi',
    description: 'Sağlık olaylarını kronolojik görüntüle',
    icon: 'time-outline',
    route: '/tools/timeline',
    accent: 'blue',
  },
  {
    title: 'Gelişmiş Arama',
    description: 'Tüm verilerde arama ve filtreleme',
    icon: 'search-outline',
    route: '/tools/search',
    accent: 'purple',
  },
  {
    title: 'AI Analiz',
    description: 'Belge çapraz analizi & sağlık raporu',
    icon: 'analytics-outline',
    route: '/tools/ai-analysis',
    accent: 'teal',
  },
  {
    title: 'Doktora Hazırlan',
    description: 'Randevu hazırlık raporu oluştur',
    icon: 'medical-outline',
    route: '/tools/doctor-prep',
    accent: 'pink',
    premium: true,
  },
  {
    title: 'İlaç Etkileşimi',
    description: 'Son 30 gün ilaç ve reçete etkileşim analizi',
    icon: 'shield-checkmark-outline',
    route: '/tools/medication-interactions',
    accent: 'pink',
    premium: true,
  },
  {
    title: 'Aile Takibi',
    description: 'Aile üyelerinin sağlık verilerini izle',
    icon: 'people-outline',
    route: '/family',
    accent: 'blue',
  },
];

export default function ToolsIndexScreen() {
  const { user } = useAuthStore();

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Araç Kutusu</Text>
          <Text style={styles.headerTitle}>Sağlık Araçları</Text>
          <Muted>Gelişmiş analiz ve AI özellikleri</Muted>
        </View>
      </FadeIn>

      <View style={{ gap: 12, marginTop: 4 }}>
        {TOOLS.map((tool, idx) => (
          <ToolCard key={tool.route} tool={tool} delay={80 + idx * 70} isPremium={user?.is_premium} />
        ))}
      </View>
    </Screen>
  );
}

function ToolCard({ tool, delay, isPremium }: { tool: Tool; delay: number; isPremium?: boolean }) {
  const palette = {
    teal: { iconBg: 'rgba(15,184,165,0.18)', border: 'rgba(15,184,165,0.35)', icon: colors.teal300, sheen: 'rgba(15,184,165,0.06)' },
    blue: { iconBg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.35)', icon: colors.blueLight, sheen: 'rgba(59,130,246,0.06)' },
    purple: { iconBg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.35)', icon: '#c084fc', sheen: 'rgba(168,85,247,0.06)' },
    pink: { iconBg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.35)', icon: '#f472b6', sheen: 'rgba(236,72,153,0.06)' },
  }[tool.accent];

  return (
    <FadeIn delay={delay}>
      <Pressable
        onPress={() => router.push(tool.route as any)}
        style={({ pressed }) => [
          styles.card,
          { borderColor: palette.border },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <LinearGradient
          colors={[palette.sheen, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={[styles.iconWrap, { backgroundColor: palette.iconBg, borderColor: palette.border }]}>
          <Ionicons name={tool.icon} color={palette.icon} size={28} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.cardTitle}>{tool.title}</Text>
            {tool.premium && !isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" color={colors.yellow} size={10} />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
          <Muted>{tool.description}</Muted>
        </View>
        <Ionicons name="chevron-forward" color={colors.navy400} size={20} />
      </Pressable>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 8,
    gap: 4,
  },
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
  card: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumText: {
    color: colors.yellow,
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
});
