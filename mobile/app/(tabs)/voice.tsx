import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../src/components/ui';
import useHealthStore from '../../src/stores/healthStore';
import useVoiceStore from '../../src/stores/voiceStore';
import { colors } from '../../src/theme';

export default function VoiceScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const { selectedDate, addSymptom, addMedication, addSleep, addNutrition } = useHealthStore();
  const { transcribeAudio, parseTranscript, parseResult, clearResult, isLoading } = useVoiceStore();
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    (async () => {
      await AudioModule.requestRecordingPermissionsAsync();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
  }, []);

  const startRecording = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('Ses kaydı başlatılamadı', 'Mikrofon iznini kontrol edin.');
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      const text = await transcribeAudio(uri);
      setTranscript(text);
    } catch (error: any) {
      Alert.alert('Ses çevrilemedi', error.response?.data?.detail || 'Tekrar deneyin.');
    }
  };

  const handleParse = async () => {
    if (!transcript.trim()) return;
    try {
      await parseTranscript(transcript.trim(), selectedDate);
    } catch (error: any) {
      Alert.alert('Analiz edilemedi', error.response?.data?.detail || 'Metni kontrol edin.');
    }
  };

  const handleConfirm = async () => {
    if (!parseResult) return;
    const data = parseResult.extracted_data;
    try {
      if (parseResult.intent === 'symptom') {
        await addSymptom({ date: selectedDate, symptom_name: data.symptom_name, severity: Number(data.severity || 5), notes: data.notes || transcript });
      }
      if (parseResult.intent === 'medication') {
        await addMedication({ date: selectedDate, name: data.name, dosage: data.dosage || 'Belirtilmedi', time_taken: data.time_taken || null, notes: data.notes || transcript });
      }
      if (parseResult.intent === 'sleep') {
        await addSleep({ date: selectedDate, hours_slept: Number(data.hours_slept || 0), quality: data.quality || 'good', notes: data.notes || transcript });
      }
      if (parseResult.intent === 'nutrition') {
        await addNutrition({ date: selectedDate, meal_type: data.meal_type || 'snack', water_ml: Number(data.water_ml || 0), notes: data.notes || transcript });
      }
      setTranscript('');
      clearResult();
      Alert.alert('Kayıt eklendi', 'Sesli kayıt sağlık günlüğüne işlendi.');
    } catch (error: any) {
      Alert.alert('Kayıt eklenemedi', error.response?.data?.detail || 'Taslağı kontrol edin.');
    }
  };

  return (
    <Screen>
      <Title>Sesli Asistan</Title>
      <Card>
        <Muted>Konuşmayı kaydet, AI metne çevirsin ve sağlık kaydı taslağı oluştursun.</Muted>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppButton title={recorderState.isRecording ? 'Kaydediliyor' : 'Kayda Başla'} onPress={startRecording} disabled={recorderState.isRecording} />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton title="Durdur" variant="secondary" onPress={stopRecording} disabled={!recorderState.isRecording} />
          </View>
        </View>
        <Field label="Metin" value={transcript} onChangeText={setTranscript} multiline />
        <AppButton title="Analiz Et" onPress={handleParse} loading={isLoading} disabled={!transcript.trim()} />
      </Card>

      {parseResult && (
        <Card>
          <Text style={styles.resultTitle}>{parseResult.intent} - %{Math.round(parseResult.confidence * 100)}</Text>
          {parseResult.warnings?.length ? <Muted>{parseResult.warnings.join(' ')}</Muted> : null}
          <Muted>{JSON.stringify(parseResult.extracted_data, null, 2)}</Muted>
          <AppButton title="Kayda Ekle" onPress={handleConfirm} disabled={parseResult.intent === 'unknown'} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultTitle: { color: colors.white, fontSize: 17, fontWeight: '900' },
});
