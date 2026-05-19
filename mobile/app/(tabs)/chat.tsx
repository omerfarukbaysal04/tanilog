import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, FadeIn, Field, GlassCard, LinearGradient, Muted, Screen } from '../../src/components/ui';
import useChatStore from '../../src/stores/chatStore';
import { colors } from '../../src/theme';

const SUGGESTIONS = [
  'Son haftadaki uyku düzenim nasıl?',
  'Hangi ilaçları kullanıyorum?',
  'Belgelerimde dikkat çeken bir bulgu var mı?',
  'Beslenme alışkanlığım hakkında öneri ver',
];

export default function ChatScreen() {
  const { sessions, activeSession, messages, fetchSessions, openSession, sendMessage, isSending } = useChatStore();
  const [message, setMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchSessions().catch((error) => Alert.alert('Sohbetler alınamadı', error.message));
    }, [fetchSessions]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSessions();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSend = async (text?: string) => {
    const finalText = (text ?? message).trim();
    if (!finalText) return;
    try {
      await sendMessage(finalText);
      setMessage('');
    } catch (error: any) {
      Alert.alert('Mesaj gönderilemedi', error.response?.data?.detail || error.message);
    }
  };

  return (
    <Screen withOrbs onRefresh={handleRefresh} refreshing={refreshing}>
      <FadeIn delay={0}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>AI Asistan</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeSession?.title || 'Yeni Sohbet'}
            </Text>
          </View>
          <Pressable onPress={() => setShowHistory((v) => !v)} style={styles.historyBtn}>
            <Ionicons name="time-outline" color={colors.teal300} size={18} />
          </Pressable>
        </View>
      </FadeIn>

      {showHistory && sessions.length > 0 && (
        <FadeIn delay={0}>
          <GlassCard>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="archive-outline" color={colors.teal300} size={16} />
              </View>
              <Text style={styles.cardTitle}>Sohbet Geçmişi</Text>
            </View>
            {sessions.map((session, i) => (
              <Pressable
                key={session.id}
                onPress={() => { openSession(session); setShowHistory(false); }}
                style={({ pressed }) => [
                  styles.sessionRow,
                  i > 0 && styles.sessionDivider,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <View style={styles.sessionDot} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                  <Muted>{new Date(session.created_at).toLocaleDateString('tr-TR')}</Muted>
                </View>
                <Ionicons name="chevron-forward" color={colors.navy400} size={16} />
              </Pressable>
            ))}
          </GlassCard>
        </FadeIn>
      )}

      {/* Mesajlar */}
      <FadeIn delay={100}>
        <GlassCard>
          {messages.length ? (
            <View style={{ gap: 10 }}>
              {messages.map((item, idx) => (
                <FadeIn key={item.id} delay={idx * 30}>
                  <View style={[styles.bubbleWrap, item.role === 'user' && styles.bubbleWrapUser]}>
                    {item.role === 'assistant' && (
                      <LinearGradient
                        colors={['#2dd4bf', '#0fb8a5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                      >
                        <Ionicons name="sparkles" color={colors.white} size={14} />
                      </LinearGradient>
                    )}
                    <View
                      style={[
                        styles.bubble,
                        item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                      ]}
                    >
                      <Text style={styles.bubbleText}>{item.content}</Text>
                    </View>
                    {item.role === 'user' && (
                      <View style={[styles.avatar, styles.avatarUser]}>
                        <Ionicons name="person" color={colors.white} size={14} />
                      </View>
                    )}
                  </View>
                </FadeIn>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubble-ellipses" color={colors.teal300} size={32} />
              </View>
              <Text style={styles.emptyTitle}>Merhaba! Sana nasıl yardım edebilirim?</Text>
              <Muted>Sağlık kayıtların ve belgelerin hakkında soru sorabilirsin.</Muted>

              <View style={{ marginTop: 14, gap: 8, width: '100%' }}>
                {SUGGESTIONS.map((s, i) => (
                  <Pressable
                    key={s}
                    onPress={() => handleSend(s)}
                    style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="bulb-outline" color={colors.teal300} size={14} />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </GlassCard>
      </FadeIn>

      {/* Input */}
      <FadeIn delay={150}>
        <GlassCard>
          <Field
            label=""
            value={message}
            onChangeText={setMessage}
            placeholder="Mesajını yaz..."
            multiline
          />
          <AppButton
            title="Gönder"
            onPress={() => handleSend()}
            loading={isSending}
            disabled={!message.trim()}
            icon={<Ionicons name="send" color={colors.white} size={16} />}
          />
        </GlassCard>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 4, gap: 12 },
  headerEyebrow: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.4,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  cardTitle: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  sessionDivider: { borderTopWidth: 1, borderTopColor: 'rgba(159,179,200,0.08)' },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal500 },
  sessionTitle: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: { backgroundColor: 'rgba(59,130,246,0.4)' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(20,40,58,0.85)',
    borderColor: 'rgba(15,184,165,0.25)',
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: 'rgba(15,184,165,0.25)',
    borderColor: 'rgba(15,184,165,0.4)',
    borderWidth: 1,
    borderTopRightRadius: 4,
  },
  bubbleText: { color: colors.white, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(15,184,165,0.12)',
    borderColor: 'rgba(15,184,165,0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.12)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  suggestionText: { color: colors.navy200, fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
});
