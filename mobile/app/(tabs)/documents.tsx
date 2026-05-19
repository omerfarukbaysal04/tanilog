import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AppButton, EmptyState, FadeIn, Field, GlassCard, Muted, RenamePrompt, Screen } from '../../src/components/ui';
import useDocumentStore, { UploadAsset } from '../../src/stores/documentStore';
import useAuthStore from '../../src/stores/authStore';
import { DocumentItem } from '../../src/types';
import { colors } from '../../src/theme';

const FREE_MONTHLY_LIMIT = 3;

const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'tahlil', label: 'Kan/İdrar Tahlili', icon: 'flask-outline' },
  { key: 'mr', label: 'MR/Röntgen/Tomografi', icon: 'scan-outline' },
  { key: 'recete', label: 'Reçete', icon: 'medkit-outline' },
  { key: 'epikriz', label: 'Epikriz/Rapor', icon: 'reader-outline' },
  { key: 'diger', label: 'Diğer', icon: 'document-outline' },
];

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const { documents, fetchDocuments, uploadDocument, analyzeDocument, renameDocument, deleteDocument, fileUrl, authHeaders, uploading } = useDocumentStore();
  const [asset, setAsset] = useState<UploadAsset | null>(null);
  const [category, setCategory] = useState('tahlil');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [renaming, setRenaming] = useState<DocumentItem | null>(null);

  // Monthly upload count for free users
  const thisMonthCount = (() => {
    const now = new Date();
    return documents.filter((d) => {
      const dt = new Date(d.created_at);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    }).length;
  })();

  useFocusEffect(
    useCallback(() => {
      fetchDocuments().catch((error) => Alert.alert('Belgeler alınamadı', error.message));
      authHeaders().then(setHeaders).catch(() => {});
    }, [authHeaders, fetchDocuments]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDocuments();
      await authHeaders().then(setHeaders);
    } finally {
      setRefreshing(false);
    }
  };

  const pickCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kamera izni gerekli', 'Belge fotoğraflamak için kamera izni vermelisin.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const item = result.assets[0];
      setAsset({ uri: item.uri, name: item.fileName || `tanilog-${Date.now()}.jpg`, mimeType: item.mimeType || 'image/jpeg' });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const item = result.assets[0];
      setAsset({ uri: item.uri, name: item.name, mimeType: item.mimeType || 'application/octet-stream' });
    }
  };

  const handleUpload = async () => {
    if (!asset) return;
    try {
      await uploadDocument(asset, category, notes);
      setAsset(null);
      setNotes('');
      Alert.alert('Belge yüklendi', 'Belge arşive eklendi.');
    } catch (error: any) {
      Alert.alert('Belge yüklenemedi', error.response?.data?.detail || 'Dosya veya limitleri kontrol edin.');
    }
  };

  const selectDocument = async (item: DocumentItem) => {
    setSelected(item);
    setAnalysis(null);
    setImageUri(null);
    if (item.file_type.startsWith('image/')) {
      setImageLoading(true);
      try {
        const h = await authHeaders();
        const url = fileUrl(item.id);
        const response = await fetch(url, { headers: h });
        if (response.ok) {
          // Convert ArrayBuffer → base64 data URI using btoa (available in Hermes/React Native)
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
          }
          const base64 = btoa(binary);
          setImageUri(`data:${item.file_type};base64,${base64}`);
        } else {
          setImageUri(null);
        }
      } catch {
        setImageUri(null);
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleAnalyze = async (id: number) => {
    setAnalyzing(true);
    try {
      const data = await analyzeDocument(id);
      setAnalysis(data.summary || data.full_analysis || 'Analiz tamamlandı.');
    } catch (error: any) {
      Alert.alert('Analiz yapılamadı', error.response?.data?.detail || 'Daha sonra tekrar deneyin.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Arşiv</Text>
          <Text style={styles.headerTitle}>Belgelerim</Text>
        </View>
      </FadeIn>

      {/* Yükleme */}
      <FadeIn delay={80}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="cloud-upload-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Yeni Belge</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Kamera"
                onPress={pickCamera}
                icon={<Ionicons name="camera-outline" color={colors.white} size={18} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Dosya"
                variant="secondary"
                onPress={pickFile}
                icon={<Ionicons name="folder-open-outline" color={colors.white} size={18} />}
              />
            </View>
          </View>

          {asset ? (
            <View style={styles.assetBox}>
              <Ionicons name="document-attach-outline" color={colors.teal300} size={16} />
              <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
              <Pressable onPress={() => setAsset(null)}>
                <Ionicons name="close-circle" color={colors.navy400} size={18} />
              </Pressable>
            </View>
          ) : (
            <Muted>PDF, JPG veya PNG yükleyebilirsin.</Muted>
          )}

          {/* Kategori pill */}
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Ionicons name={cat.icon} color={active ? colors.teal300 : colors.navy400} size={14} />
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field
            label="Not (opsiyonel)"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Belge hakkında..."
          />
          {/* Free user monthly limit indicator */}
          {!user?.is_premium && (
            <View style={styles.limitBar}>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.limitRow}>
                  <Text style={styles.limitLabel}>Bu ay yükleme</Text>
                  <Text style={[styles.limitCount, thisMonthCount >= FREE_MONTHLY_LIMIT && { color: colors.red }]}>
                    {thisMonthCount}/{FREE_MONTHLY_LIMIT}
                  </Text>
                </View>
                <View style={styles.limitTrack}>
                  <View style={[styles.limitFill, { width: `${Math.min(thisMonthCount / FREE_MONTHLY_LIMIT, 1) * 100}%`, backgroundColor: thisMonthCount >= FREE_MONTHLY_LIMIT ? colors.red : colors.teal300 }]} />
                </View>
              </View>
              {thisMonthCount >= FREE_MONTHLY_LIMIT && (
                <Ionicons name="warning-outline" color={colors.red} size={16} />
              )}
            </View>
          )}
          <AppButton
            title="Yükle"
            onPress={handleUpload}
            loading={uploading}
            disabled={!asset || (!user?.is_premium && thisMonthCount >= FREE_MONTHLY_LIMIT)}
            icon={<Ionicons name="arrow-up-outline" color={colors.white} size={18} />}
          />
        </GlassCard>
      </FadeIn>

      {/* Seçili belge önizleme */}
      {selected && (
        <FadeIn delay={0}>
          <GlassCard accent="blue">
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' }]}>
                <Ionicons name="eye-outline" color={colors.blueLight} size={16} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{selected.original_filename}</Text>
            </View>
            {selected.file_type.startsWith('image/') ? (
              imageLoading ? (
                <View style={[styles.previewImage, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Muted>Görsel yükleniyor...</Muted>
                </View>
              ) : imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={[styles.previewImage, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="image-outline" color={colors.navy400} size={40} />
                  <Muted>Görsel yüklenemedi.</Muted>
                </View>
              )
            ) : (
              <View style={styles.pdfNotice}>
                <View style={styles.pdfIcon}>
                  <Ionicons name="document-attach" color={colors.blueLight} size={28} />
                </View>
                <Text style={styles.pdfTitle}>PDF Belgesi</Text>
                <Muted>Bu dosya formatı için önizleme desteklenmiyor. Cihazının PDF okuyucusunda açabilirsin.</Muted>
              </View>
            )}
            {analysis ? (
              <View style={styles.analysisBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="sparkles" color={colors.teal300} size={14} />
                  <Text style={styles.analysisLabel}>AI Analizi</Text>
                </View>
                <Text style={styles.analysisText}>{analysis}</Text>
              </View>
            ) : null}
            <AppButton
              title="AI Analiz"
              onPress={() => handleAnalyze(selected.id)}
              loading={analyzing}
              icon={<Ionicons name="sparkles-outline" color={colors.white} size={16} />}
            />
            <AppButton
              title="Kapat"
              variant="ghost"
              onPress={() => { setSelected(null); setAnalysis(null); setImageUri(null); }}
            />
          </GlassCard>
        </FadeIn>
      )}

      {/* Arşiv listesi */}
      <FadeIn delay={160}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="archive-outline" color={colors.teal300} size={16} />
            </View>
            <Text style={styles.cardTitle}>Arşiv ({documents.length})</Text>
          </View>
          {documents.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="documents-outline" color={colors.teal300} size={28} />}
              title="Henüz belge yok"
              description="Lab sonuçları, reçeteler ve görüntülemelerini buraya ekle."
            />
          ) : documents.map((item, i) => (
            <View key={item.id} style={[styles.docRow, i > 0 && styles.docDivider]}>
              <Pressable onPress={() => selectDocument(item)} style={styles.docMain}>
                <View style={styles.docIcon}>
                  <Ionicons
                    name={item.file_type.startsWith('image/') ? 'image-outline' : 'document-text-outline'}
                    color={colors.teal300}
                    size={18}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.docTitle} numberOfLines={1}>{item.original_filename}</Text>
                  <Muted>{item.category} · {(item.file_size / (1024 * 1024)).toFixed(2)} MB</Muted>
                </View>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => setRenaming(item)} style={styles.iconBtn}>
                <Ionicons name="create-outline" color={colors.teal300} size={16} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  Alert.alert('Belgeyi sil', `"${item.original_filename}" silinsin mi?`, [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Sil',
                      style: 'destructive',
                      onPress: () => deleteDocument(item.id).catch((e) => Alert.alert('Silinemedi', e.message)),
                    },
                  ])
                }
                style={[styles.iconBtn, styles.iconBtnRed]}
              >
                <Ionicons name="trash-outline" color={colors.redLight} size={16} />
              </Pressable>
            </View>
          ))}
        </GlassCard>
      </FadeIn>

      <RenamePrompt
        visible={!!renaming}
        currentName={renaming?.original_filename || ''}
        onClose={() => setRenaming(null)}
        onSubmit={async (newName) => {
          if (!renaming) return;
          // Preserve original extension
          const origExt = renaming.original_filename.includes('.')
            ? renaming.original_filename.substring(renaming.original_filename.lastIndexOf('.'))
            : '';
          let finalName = newName.trim();
          if (origExt && !finalName.toLowerCase().endsWith(origExt.toLowerCase())) {
            // Strip any extension user typed and add original
            const dotIdx = finalName.lastIndexOf('.');
            if (dotIdx > 0) finalName = finalName.substring(0, dotIdx);
            finalName = finalName + origExt;
          }
          try {
            await renameDocument(renaming.id, finalName);
            setRenaming(null);
          } catch (e: any) {
            Alert.alert('Yeniden adlandırma başarısız', e.response?.data?.detail || e.message);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 4, gap: 4 },
  pdfNotice: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderRadius: 14,
  },
  pdfIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
  docMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(15,184,165,0.10)',
    borderColor: 'rgba(15,184,165,0.25)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  iconBtnRed: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.25)',
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
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
  cardTitle: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_700Bold', flex: 1 },
  label: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.12)',
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
  },
  pillText: { color: colors.navy300, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  pillTextActive: { color: colors.teal300 },
  assetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,184,165,0.08)',
    borderColor: 'rgba(15,184,165,0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  assetName: { color: colors.white, fontSize: 12, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  previewImage: { width: '100%', height: 280, borderRadius: 14, backgroundColor: colors.navy950 },
  pdfBox: { height: 320, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.navy950 },
  analysisBox: {
    backgroundColor: 'rgba(15,184,165,0.06)',
    borderColor: 'rgba(15,184,165,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  analysisLabel: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  analysisText: { color: colors.navy100, fontSize: 13, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  docDivider: { borderTopWidth: 1, borderTopColor: 'rgba(159,179,200,0.08)' },
  docIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.25)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 13 },
  limitBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,184,165,0.06)',
    borderColor: 'rgba(15,184,165,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  limitCount: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  limitTrack: {
    height: 4,
    backgroundColor: 'rgba(159,179,200,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  limitFill: {
    height: 4,
    borderRadius: 2,
  },
});
