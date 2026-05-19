import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, EmptyState, FadeIn, GlassCard, Muted, Screen } from '../../../src/components/ui';
import api from '../../../src/lib/api';
import { isTTSAvailable, speak } from '../../../src/lib/tts';
import { colors } from '../../../src/theme';
import { DocumentItem, SavedDoctorReport } from '../../../src/types';

type Category = 'doctor' | 'documents';

type CategoryMeta = {
  key: Category;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
};

const CATEGORIES: CategoryMeta[] = [
  { key: 'doctor', label: 'Doktor Raporları', icon: 'medical-outline', accent: 'pink' },
  { key: 'documents', label: 'Belge Analizleri', icon: 'document-text-outline', accent: 'blue' },
];

type AnalyzedDocument = DocumentItem & {
  ai_summary?: string;
  ai_analyzed_at?: string;
};

export default function ReportsScreen() {
  const [category, setCategory] = useState<Category>('doctor');
  const [doctorReports, setDoctorReports] = useState<SavedDoctorReport[]>([]);
  const [analyzedDocs, setAnalyzedDocs] = useState<AnalyzedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [doc, ana] = await Promise.allSettled([
        api.get<SavedDoctorReport[]>('/ai/doctor-prep/saved'),
        api.get<AnalyzedDocument[]>('/ai/analyzed-documents'),
      ]);
      if (doc.status === 'fulfilled') setDoctorReports(doc.value.data);
      if (ana.status === 'fulfilled') setAnalyzedDocs(ana.value.data);
    } catch (e: any) {
      Alert.alert('Raporlar alınamadı', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  const total = doctorReports.length + analyzedDocs.length;

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Arşiv</Text>
          <Text style={styles.title}>Raporlarım</Text>
          <Muted>
            {total > 0
              ? `Toplam ${total} kayıtlı rapor. Kategori kategori incele ve paylaş.`
              : 'Henüz kayıtlı rapor yok.'}
          </Muted>
        </View>
      </FadeIn>

      {/* Kategori seçici */}
      <FadeIn delay={80}>
        <View style={styles.tabRow}>
          {CATEGORIES.map((cat) => {
            const count = cat.key === 'doctor' ? doctorReports.length : analyzedDocs.length;
            const isActive = category === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  color={isActive ? colors.teal300 : colors.navy400}
                  size={16}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {cat.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                    <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </FadeIn>

      {/* İçerik */}
      {category === 'doctor' ? (
        doctorReports.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="medical-outline" color={colors.teal300} size={28} />}
            title="Doktor raporu yok"
            description="Araçlar > Doktora Hazırlan ekranından rapor oluşturup kaydedebilirsin."
            action={
              <AppButton
                title="Doktora Hazırlan"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/tools/doctor-prep')}
              />
            }
          />
        ) : (
          doctorReports.map((rep, idx) => (
            <FadeIn key={rep.id} delay={120 + idx * 60}>
              <ReportCard
                title={rep.title}
                subtitle={`${rep.period_start} → ${rep.period_end}`}
                summary={rep.summary}
                createdAt={rep.created_at}
                accent="pink"
                icon="medical"
                onShare={async () => {
                  try {
                    await Share.share({
                      title: rep.title,
                      message: `${rep.title}\n\n${rep.summary}\n\nDönem: ${rep.period_start} → ${rep.period_end}`,
                    });
                  } catch {}
                }}
              />
            </FadeIn>
          ))
        )
      ) : analyzedDocs.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="document-text-outline" color={colors.blueLight} size={28} />}
          title="Analizli belge yok"
          description="Belgelerine AI analiz yaptırdığında burada listelenir."
          action={
            <AppButton
              title="Belgelere Git"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/documents')}
            />
          }
        />
      ) : (
        analyzedDocs.map((doc, idx) => (
          <FadeIn key={doc.id} delay={120 + idx * 60}>
            <Pressable onPress={() => router.push('/documents')}>
              <ReportCard
                title={doc.original_filename}
                subtitle={doc.category || doc.file_type}
                summary={doc.ai_summary || doc.notes || 'AI analiz özeti mevcut.'}
                createdAt={doc.ai_analyzed_at || doc.created_at}
                accent="blue"
                icon="document-text"
                onShare={async () => {
                  try {
                    await Share.share({
                      title: doc.original_filename,
                      message: `${doc.original_filename}\n\n${doc.ai_summary || ''}`,
                    });
                  } catch {}
                }}
              />
            </Pressable>
          </FadeIn>
        ))
      )}
    </Screen>
  );
}

function ReportCard({
  title,
  subtitle,
  summary,
  createdAt,
  accent,
  icon,
  onShare,
}: {
  title: string;
  subtitle: string;
  summary: string;
  createdAt: string;
  accent: 'teal' | 'blue' | 'purple' | 'pink';
  icon: keyof typeof Ionicons.glyphMap;
  onShare: () => void;
}) {
  const palette = {
    teal: { bg: 'rgba(15,184,165,0.15)', border: 'rgba(15,184,165,0.35)', icon: colors.teal300 },
    blue: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', icon: colors.blueLight },
    purple: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', icon: '#c084fc' },
    pink: { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.35)', icon: '#f472b6' },
  }[accent];

  const d = new Date(createdAt);
  const dateText = isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <GlassCard accent={accent}>
      <View style={styles.cardRow}>
        <View style={[styles.iconBox, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <Ionicons name={icon} color={palette.icon} size={18} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>

      {summary ? (
        <Text style={styles.cardSummary} numberOfLines={4}>{summary}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        {dateText && (
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" color={colors.navy500} size={12} />
            <Text style={styles.dateText}>{dateText}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {isTTSAvailable() && (
            <Pressable onPress={() => speak(`${title}. ${summary}`)} style={styles.shareBtn}>
              <Ionicons name="volume-high" color={colors.teal300} size={14} />
              <Text style={styles.shareText}>Sesli Oku</Text>
            </Pressable>
          )}
          <Pressable onPress={onShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" color={colors.teal300} size={14} />
            <Text style={styles.shareText}>Paylaş</Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
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
    fontSize: 26,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(15,184,165,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.35)',
  },
  tabText: {
    color: colors.navy400,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  tabTextActive: {
    color: colors.teal300,
  },
  countBadge: {
    backgroundColor: 'rgba(159,179,200,0.15)',
    paddingHorizontal: 6,
    minWidth: 18,
    paddingVertical: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(15,184,165,0.25)',
  },
  countText: {
    color: colors.navy400,
    fontSize: 10,
    fontFamily: 'Poppins_800ExtraBold',
  },
  countTextActive: {
    color: colors.teal300,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 19,
  },
  cardSubtitle: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  cardSummary: {
    color: colors.navy300,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: colors.navy500,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shareText: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
});
