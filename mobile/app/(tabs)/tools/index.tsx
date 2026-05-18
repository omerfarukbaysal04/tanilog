import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Muted, Screen, Title } from '../../../src/components/ui';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

type Tool = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  premium?: boolean;
};

const TOOLS: Tool[] = [
  {
    title: 'Zaman Çizelgesi',
    description: 'Tüm sağlık olaylarını kronolojik olarak görüntüle',
    icon: 'time-outline',
    route: '/tools/timeline',
  },
  {
    title: 'Gelişmiş Arama',
    description: 'Tüm sağlık verilerinde arama yap ve filtrele',
    icon: 'search-outline',
    route: '/tools/search',
  },
  {
    title: 'AI Analiz',
    description: 'Belgelerini ve sağlık verilerini AI ile analiz et',
    icon: 'analytics-outline',
    route: '/tools/ai-analysis',
  },
  {
    title: 'Doktora Hazırlan',
    description: 'Randevuna hazırlık raporu oluştur ve paylaş',
    icon: 'medical-outline',
    route: '/tools/doctor-prep',
    premium: true,
  },
];

export default function ToolsIndexScreen() {
  const { user } = useAuthStore();

  return (
    <Screen>
      <Title>Araçlar</Title>
      <Muted>Gelişmiş sağlık araçları ve AI özellikleri</Muted>

      <View style={{ gap: 12, marginTop: 4 }}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.route}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
            onPress={() => router.push(tool.route as any)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={tool.icon} color={colors.teal300} size={26} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                {tool.premium && !user?.is_premium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}
              </View>
              <Muted>{tool.description}</Muted>
            </View>
            <Ionicons name="chevron-forward" color={colors.navy400} size={18} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  premiumBadge: {
    backgroundColor: colors.teal500 + '33',
    borderWidth: 1,
    borderColor: colors.teal500,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: colors.teal300,
    fontSize: 10,
    fontWeight: '700',
  },
});
