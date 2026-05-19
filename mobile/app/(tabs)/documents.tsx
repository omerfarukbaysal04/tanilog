import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { AppButton, FadeIn, Field, GlassCard, Muted, Screen } from '../../src/components/ui';
import useDocumentStore, { UploadAsset } from '../../src/stores/documentStore';
import { DocumentItem } from '../../src/types';
import { colors } from '../../src/theme';

const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'lab', label: 'Lab', icon: 'flask-outline' },
  { key: 'imaging', label: 'Görüntüleme', icon: 'scan-outline' },
  { key: 'prescription', label: 'Reçete', icon: 'medkit-outline' },
  { key: 'other', label: 'Diğer', icon: 'document-outline' },
];

export default function DocumentsScreen() {
  const { documents, fetchDocuments, uploadDocument, analyzeDocument, fileUrl, authHeaders, uploading } = useDocumentStore();
  const [asset, setAsset] = useState<UploadAsset | null>(null);
  const [category, setCategory] = useState('lab');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDocuments().catch((error) => Alert.alert('Belgeler alınamadı', error.message));
      authHeaders().then(setHeaders).catch(() => {});
    }, [authHeaders, fetchDocuments]),
  );

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
    <Screen withOrbs>
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
          <AppButton
            title="Yükle"
            onPress={handleUpload}
            loading={uploading}
            disabled={!asset}
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
              <Image source={{ uri: fileUrl(selected.id), headers }} style={styles.previewImage} />
            ) : (
              <View style={styles.pdfBox}>
                <WebView source={{ uri: fileUrl(selected.id), headers }} style={{ flex: 1 }} />
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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="AI Analiz"
                  onPress={() => handleAnalyze(selected.id)}
                  loading={analyzing}
                  icon={<Ionicons name="sparkles-outline" color={colors.white} size={16} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Kapat"
                  variant="secondary"
                  onPress={() => { setSelected(null); setAnalysis(null); }}
                />
              </View>
            </View>
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
          {documents.length ? documents.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => setSelected(item)}
              style={({ pressed }) => [
                styles.docRow,
                i > 0 && styles.docDivider,
                pressed && { opacity: 0.6 },
              ]}
            >
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
              <Ionicons name="chevron-forward" color={colors.navy400} size={18} />
            </Pressable>
          )) : <Muted>Henüz belge yok. İlk belgeni yükle.</Muted>}
        </GlassCard>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 4, gap: 4 },
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
});
