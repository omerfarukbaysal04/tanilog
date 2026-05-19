import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { AppButton, FadeIn, Field, GlassCard, LinearGradient, Muted, Screen, UsageLimitBar } from '../../../src/components/ui';
import useHealthStore from '../../../src/stores/healthStore';
import useVoiceStore from '../../../src/stores/voiceStore';
import useAuthStore from '../../../src/stores/authStore';
import { colors } from '../../../src/theme';

const FIELD_LABELS: Record<string, string> = {
  symptom_name: 'Semptom',
  severity: 'Şiddet',
  name: 'İlaç adı',
  dosage: 'Doz',
  time_taken: 'Saat',
  reminder_time: 'Hatırlatma saati',
  reminder_enabled: 'Hatırlatıcı',
  hours_slept: 'Uyku süresi',
  quality: 'Kalite',
  meal_type: 'Öğün',
  water_ml: 'Su (ml)',
  notes: 'Not',
  date: 'Tarih',
  frequency: 'Sıklık',
};

function trField(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  // Default: snake_case → Düzgün başlık
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const INTENT_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  symptom: { label: 'Semptom', icon: 'pulse-outline', accent: '#f472b6' },
  medication: { label: 'İlaç', icon: 'medkit-outline', accent: colors.teal300 },
  sleep: { label: 'Uyku', icon: 'moon-outline', accent: colors.blueLight },
  nutrition: { label: 'Beslenme', icon: 'restaurant-outline', accent: '#c084fc' },
  unknown: { label: 'Belirsiz', icon: 'help-circle-outline', accent: colors.navy400 },
};

export default function VoiceScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const { selectedDate, addSymptom, addMedication, addSleep, addNutrition } = useHealthStore();
  const { transcribeAudio, parseTranscript, parseResult, clearResult, isLoading, usage, fetchUsage } = useVoiceStore();
  const { user } = useAuthStore();
  const [transcript, setTranscript] = useState('');

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      await AudioModule.requestRecordingPermissionsAsync();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
    fetchUsage().catch(() => {});
  }, []);

  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    // Yeni kayda başlarken eski sonucu temizle (ardışık konuşma için)
    clearResult();
    setTranscript('');
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

  const intent = parseResult ? INTENT_META[parseResult.intent] ?? INTENT_META.unknown : null;
  const isRec = recorderState.isRecording;

  return (
    <Screen withOrbs>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Sesli Asistan</Text>
          <Text style={styles.headerTitle}>Konuş, AI Yazsın</Text>
          <Muted>Mikrofona basıp konuş, AI metnini sağlık kaydına dönüştürsün.</Muted>
        </View>
      </FadeIn>

      {/* Kullanım sınırı (free için) */}
      {usage && (
        <FadeIn delay={60}>
          <GlassCard>
            <UsageLimitBar
              label="Bugün Sesli Giriş"
              used={usage.used_today}
              total={usage.limit === -1 ? 0 : usage.limit}
              isPremium={usage.is_premium}
            />
            {!usage.is_premium && usage.remaining === 0 && (
              <Muted>Günlük limit doldu. Sınırsız kullanım için Premium'a geç.</Muted>
            )}
          </GlassCard>
        </FadeIn>
      )}

      {/* Mikrofon */}
      <FadeIn delay={100}>
        <GlassCard accent={isRec ? 'red' : 'teal'}>
          <View style={styles.micWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.micRing,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
                  backgroundColor: isRec ? 'rgba(239,68,68,0.4)' : 'rgba(15,184,165,0.3)',
                },
              ]}
            />
            <Pressable onPress={isRec ? stopRecording : startRecording} style={styles.micBtnWrap}>
              <LinearGradient
                colors={isRec ? ['#ef4444', '#dc2626'] : ['#2dd4bf', '#0fb8a5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.micBtn}
              >
                <Ionicons name={isRec ? 'stop' : 'mic'} color={colors.white} size={36} />
              </LinearGradient>
            </Pressable>
          </View>
          <Text style={styles.micLabel}>
            {isRec ? 'Kaydediliyor... Durdurmak için tıkla' : 'Kayda başlamak için tıkla'}
          </Text>
          <Muted>
            Örnek: "Bugün baş ağrım vardı, şiddeti 7" veya "Saat 8'de parol içtim 500mg"
          </Muted>
        </GlassCard>
      </FadeIn>

      {/* Transcript */}
      {transcript ? (
        <FadeIn delay={0}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="text-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Metin</Text>
            </View>
            <Field label="" value={transcript} onChangeText={setTranscript} multiline />
            <AppButton
              title="Analiz Et"
              onPress={handleParse}
              loading={isLoading}
              disabled={!transcript.trim()}
              icon={<Ionicons name="sparkles-outline" color={colors.white} size={18} />}
            />
          </GlassCard>
        </FadeIn>
      ) : null}

      {/* Sonuç */}
      {parseResult && intent && (
        <FadeIn delay={0}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: `${intent.accent}22`, borderColor: `${intent.accent}55` }]}>
                <Ionicons name={intent.icon} color={intent.accent} size={16} />
              </View>
              <Text style={styles.cardTitle}>{intent.label}</Text>
              <View style={styles.confBadge}>
                <Text style={styles.confText}>%{Math.round(parseResult.confidence * 100)}</Text>
              </View>
            </View>
            {parseResult.warnings?.length ? (
              <View style={styles.warnBox}>
                <Ionicons name="warning-outline" color={colors.yellow} size={14} />
                <Text style={styles.warnText}>{parseResult.warnings.join(' ')}</Text>
              </View>
            ) : null}
            <View style={styles.jsonBox}>
              {Object.entries(parseResult.extracted_data).map(([k, v]) => (
                <View key={k} style={styles.jsonRow}>
                  <Text style={styles.jsonKey}>{trField(k)}</Text>
                  <Text style={styles.jsonValue} numberOfLines={2}>{String(v ?? '-')}</Text>
                </View>
              ))}
            </View>
            <AppButton
              title="Kayda Ekle"
              onPress={handleConfirm}
              disabled={parseResult.intent === 'unknown'}
              icon={<Ionicons name="checkmark-outline" color={colors.white} size={18} />}
            />
          </GlassCard>
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 4, gap: 4 },
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
  micWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginTop: 10,
  },
  micRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  micBtnWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  micBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.teal500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  micLabel: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginTop: 4,
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
  confBadge: {
    backgroundColor: 'rgba(15,184,165,0.18)',
    borderColor: 'rgba(15,184,165,0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confText: { color: colors.teal300, fontSize: 11, fontFamily: 'Poppins_700Bold' },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  warnText: { color: '#fcd34d', fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  jsonBox: {
    backgroundColor: 'rgba(10,22,34,0.6)',
    borderColor: 'rgba(159,179,200,0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  jsonRow: { flexDirection: 'row', gap: 10 },
  jsonKey: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: 100,
  },
  jsonValue: { color: colors.white, fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
});
