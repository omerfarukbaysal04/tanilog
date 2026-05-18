import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../src/components/ui';
import useDocumentStore, { UploadAsset } from '../../src/stores/documentStore';
import { DocumentItem } from '../../src/types';
import { colors } from '../../src/theme';

export default function DocumentsScreen() {
  const { documents, fetchDocuments, uploadDocument, analyzeDocument, fileUrl, authHeaders, uploading } = useDocumentStore();
  const [asset, setAsset] = useState<UploadAsset | null>(null);
  const [category, setCategory] = useState('lab');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<string | null>(null);

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
    try {
      const data = await analyzeDocument(id);
      setAnalysis(data.summary || data.full_analysis || 'Analiz tamamlandı.');
    } catch (error: any) {
      Alert.alert('Analiz yapılamadı', error.response?.data?.detail || 'Daha sonra tekrar deneyin.');
    }
  };

  return (
    <Screen>
      <Title>Belgeler</Title>
      <Card>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><AppButton title="Kamera" onPress={pickCamera} /></View>
          <View style={{ flex: 1 }}><AppButton title="Dosya" variant="secondary" onPress={pickFile} /></View>
        </View>
        {asset ? <Muted>Seçilen: {asset.name}</Muted> : <Muted>PDF, JPG veya PNG yükleyebilirsin.</Muted>}
        <Field label="Kategori" value={category} onChangeText={setCategory} />
        <Field label="Not" value={notes} onChangeText={setNotes} multiline />
        <AppButton title="Yükle" onPress={handleUpload} loading={uploading} disabled={!asset} />
      </Card>

      {selected && (
        <Card>
          <Text style={styles.sectionTitle}>{selected.original_filename}</Text>
          {selected.file_type.startsWith('image/') ? (
            <Image source={{ uri: fileUrl(selected.id), headers }} style={styles.previewImage} />
          ) : (
            <View style={styles.pdfBox}>
              <WebView source={{ uri: fileUrl(selected.id), headers }} style={{ flex: 1 }} />
            </View>
          )}
          {analysis ? <Muted>{analysis}</Muted> : null}
          <AppButton title="AI Analiz Et" onPress={() => handleAnalyze(selected.id)} />
          <AppButton title="Kapat" variant="secondary" onPress={() => { setSelected(null); setAnalysis(null); }} />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Arşiv</Text>
        {documents.length ? documents.map((item) => (
          <Pressable key={item.id} onPress={() => setSelected(item)} style={styles.docRow}>
            <Text style={styles.docTitle}>{item.original_filename}</Text>
            <Muted>{item.category} - {(item.file_size / (1024 * 1024)).toFixed(2)} MB</Muted>
          </Pressable>
        )) : <Muted>Henüz belge yok.</Muted>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  docRow: { borderTopWidth: 1, borderTopColor: colors.navy700, paddingTop: 10, gap: 4 },
  docTitle: { color: colors.white, fontWeight: '800' },
  previewImage: { width: '100%', height: 320, borderRadius: 14, backgroundColor: colors.navy900 },
  pdfBox: { height: 360, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.navy900 },
});
