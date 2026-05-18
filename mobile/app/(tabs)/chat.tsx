import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppButton, Card, Field, Muted, Screen, Title } from '../../src/components/ui';
import useChatStore from '../../src/stores/chatStore';
import { colors } from '../../src/theme';

export default function ChatScreen() {
  const { sessions, activeSession, messages, fetchSessions, openSession, sendMessage, isSending } = useChatStore();
  const [message, setMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchSessions().catch((error) => Alert.alert('Sohbetler alınamadı', error.message));
    }, [fetchSessions]),
  );

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error: any) {
      Alert.alert('Mesaj gönderilemedi', error.response?.data?.detail || error.message);
    }
  };

  return (
    <Screen>
      <Title>AI Asistan</Title>
      <Card>
        <Text style={styles.sectionTitle}>{activeSession?.title || 'Yeni sohbet'}</Text>
        {messages.length ? messages.map((item) => (
          <View key={item.id} style={[styles.bubble, item.role === 'assistant' ? styles.assistant : styles.user]}>
            <Text style={styles.messageRole}>{item.role === 'assistant' ? 'Asistan' : 'Sen'}</Text>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )) : <Muted>Sağlık kayıtların ve belgelerin hakkında soru sorabilirsin.</Muted>}
        <Field label="Mesaj" value={message} onChangeText={setMessage} multiline />
        <AppButton title="Gönder" onPress={handleSend} loading={isSending} disabled={!message.trim()} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sohbet geçmişi</Text>
        {sessions.length ? sessions.map((session) => (
          <Pressable key={session.id} onPress={() => openSession(session)} style={styles.sessionRow}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Muted>{new Date(session.created_at).toLocaleDateString('tr-TR')}</Muted>
          </Pressable>
        )) : <Muted>Henüz sohbet yok.</Muted>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  bubble: { borderRadius: 14, padding: 12, gap: 5 },
  assistant: { backgroundColor: colors.navy800 },
  user: { backgroundColor: colors.teal500 },
  messageRole: { color: colors.white, fontSize: 12, fontWeight: '900', opacity: 0.85 },
  messageText: { color: colors.white, lineHeight: 20 },
  sessionRow: { borderTopWidth: 1, borderTopColor: colors.navy700, paddingTop: 10 },
  sessionTitle: { color: colors.white, fontWeight: '800' },
});
